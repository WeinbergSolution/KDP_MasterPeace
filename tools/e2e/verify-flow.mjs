// Functional flow test for e-mail verification against the Firebase Auth
// emulator. Covers: registration → /verify-email (not studio), deep-link
// blocking (logged-out and unverified), a real oobCode applied through our
// /auth/action handler, plan preservation, unverified-login redirect, verified
// login reaching the studio, and password reset. Also captures the auth
// screenshots. Usage: SHOTS_URL=http://localhost:4210 node tools/e2e/verify-flow.mjs

import { mkdir } from 'node:fs/promises';

const URL = process.env.SHOTS_URL ?? 'http://localhost:4210';
const PROJECT = 'demo-kdp-masterpeace';
const EMU = `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/oobCodes`;
const OUT = 'artifacts/visual/faq-auth';
const PW = 'Test1234!';
let failures = 0;

/** Records a check result. */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

/** Returns the latest VERIFY_EMAIL oob entry for an address (or null). */
async function oobFor(email) {
  const data = await (await fetch(EMU)).json();
  const codes = (data.oobCodes ?? []).filter(
    (c) => c.email === email && c.requestType === 'VERIFY_EMAIL',
  );
  return codes.at(-1) ?? null;
}

/** Registers a new account (auto-signs-in, unverified). */
async function register(page, email, plan) {
  const q = plan ? `?plan=${plan}` : '';
  await page.goto(`${URL}/register${q}`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
}

/** Captures the static auth screenshots from a fresh (guest) context. */
async function shots(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  for (const [path, name, sel] of [
    ['/register', 'register-1440x900', '.auth__card'],
    ['/verify-email', 'verify-email-1440x900', '.auth__card'],
    [
      '/auth/action?mode=verifyEmail',
      'action-invalid-1440x900',
      '.auth__error',
    ],
    ['/login?verified=1', 'login-verified-hint-1440x900', '.auth__ok'],
  ]) {
    await page.goto(URL + path, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(sel, { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }
  await ctx.close();
}

/** Registers, then checks the unverified redirects; returns the email. */
async function registerUnverified(browser) {
  const email = `verify-${Date.now()}@example.com`;
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await register(page, email, 'creator');
  await page.waitForURL(/\/verify-email/, { timeout: 15000 }).catch(() => null);
  check(
    'registration routes to /verify-email (not studio)',
    /\/verify-email/.test(page.url()),
  );
  await page.goto(`${URL}/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/verify-email/, { timeout: 10000 }).catch(() => null);
  check(
    'unverified /studio deep-link → /verify-email',
    /\/verify-email/.test(page.url()),
  );
  await ctx.close();
  return email;
}

/** Runs the full verification flow with a real oobCode. */
async function mainFlow(browser) {
  const email = await registerUnverified(browser);
  const oob = await oobFor(email);
  check('verification e-mail created in the emulator', !!oob);
  check(
    'continue URL preserves plan=creator',
    !!oob && decodeURIComponent(oob.oobLink ?? '').includes('plan=creator'),
  );

  // Open the link in a fresh, session-less context (like the real e-mail app).
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  const errs = [];
  // Network-status logs (e.g. the expected HTTP 400 from the wrong-password
  // test) are browser messages, not app errors — only JS/app errors count.
  page.on(
    'console',
    (m) =>
      m.type() === 'error' &&
      !m.text().includes('Failed to load resource') &&
      errs.push(m.text()),
  );
  page.on('pageerror', (e) => errs.push(`PE ${e.message}`));

  const cont = encodeURIComponent(`${URL}/login?verified=1&plan=creator`);
  await page.goto(
    `${URL}/auth/action?mode=verifyEmail&oobCode=${oob?.oobCode ?? 'X'}&continueUrl=${cont}`,
    { waitUntil: 'domcontentloaded' },
  );
  await page.waitForSelector('.auth__ok', { timeout: 10000 }).catch(() => null);
  const ok = await page
    .$eval('.auth__ok', (e) => e.textContent ?? '')
    .catch(() => '');
  check(
    'auth/action confirms the e-mail (success)',
    /erfolgreich bestätigt/.test(ok),
  );
  await page.screenshot({ path: `${OUT}/action-success-1440x900.png` });

  await page.click('button:has-text("Jetzt anmelden")');
  await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => null);
  check(
    'success routes to /login?verified=1&plan=creator',
    /verified=1/.test(page.url()) && /plan=creator/.test(page.url()),
  );

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', 'WrongPass!');
  await page.click('button[type="submit"]');
  await page
    .waitForSelector('.auth__error', { timeout: 10000 })
    .catch(() => null);
  check('wrong password is rejected', !!(await page.$('.auth__error')));

  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 }).catch(() => null);
  check('verified login reaches the studio', /\/studio/.test(page.url()));
  if (errs.length)
    process.stdout.write(`  console: ${errs.slice(0, 6).join(' || ')}\n`);
  check('no console errors during the flow', errs.length === 0);
  await ctx.close();
}

/** Verifies deep-link blocking (guest), unverified-login redirect, reset. */
async function guards(browser) {
  const guest = await browser.newContext();
  const gp = await guest.newPage();
  await gp.goto(`${URL}/studio`, { waitUntil: 'domcontentloaded' });
  await gp.waitForURL(/\/login/, { timeout: 10000 }).catch(() => null);
  check('logged-out /studio deep-link → /login', /\/login/.test(gp.url()));
  await guest.close();

  const email = `unverif-${Date.now()}@example.com`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await register(page, email);
  await page.waitForURL(/\/verify-email/, { timeout: 15000 }).catch(() => null);
  await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/verify-email/, { timeout: 10000 }).catch(() => null);
  check(
    'unverified login is redirected to /verify-email',
    /\/verify-email/.test(page.url()),
  );

  await page.goto(`${URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.auth__ok', { timeout: 10000 }).catch(() => null);
  check('password reset stays functional', !!(await page.$('.auth__ok')));
  await ctx.close();
}

await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const browser = await chromium.launch();
await shots(browser);
await guards(browser);
await mainFlow(browser);
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
