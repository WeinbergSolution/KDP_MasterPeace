// Full test-phase account flow (browser) against the emulators + local api
// (proxied at /api). Covers: guest header, login/register screens, monthly/annual
// tariffs, plan selection, checkout review + required checkbox, server activation
// → studio, logged-in header states, account menu, /konto, logout and relogin
// persistence. Captures the screenshots. Usage:
//   SHOTS_URL=http://localhost:4220 node tools/e2e/account-flow.mjs

import { mkdir } from 'node:fs/promises';

const URL = process.env.SHOTS_URL ?? 'http://localhost:4220';
const PROJECT = 'demo-kdp-masterpeace';
const EMU_OOB = `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/oobCodes`;
const OUT = 'artifacts/visual/account';
const PW = 'Test1234!';
let failures = 0;

/** Records a check result. */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

/** Latest VERIFY_EMAIL oobCode for an address. */
async function oobFor(email) {
  const data = await (await fetch(EMU_OOB)).json();
  const codes = (data.oobCodes ?? []).filter(
    (c) => c.email === email && c.requestType === 'VERIFY_EMAIL',
  );
  return codes.at(-1) ?? null;
}

/** Registers + verifies a user via the /auth/action handler. */
async function registerVerified(browser, email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/verify-email/, { timeout: 15000 }).catch(() => null);
  const oob = await oobFor(email);
  await page.goto(
    `${URL}/auth/action?mode=verifyEmail&oobCode=${oob?.oobCode ?? 'X'}`,
    {
      waitUntil: 'domcontentloaded',
    },
  );
  await page.waitForSelector('.auth__ok', { timeout: 10000 }).catch(() => null);
  await ctx.close();
}

/** Logs a verified user in and returns the page (in its own context). */
async function loginContext(browser, email, viewport) {
  const ctx = await browser.newContext(viewport ? { viewport } : undefined);
  const page = await ctx.newPage();
  await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page
    .waitForURL(/\/(studio|tarif-waehlen|checkout)/, { timeout: 15000 })
    .catch(() => null);
  return { ctx, page };
}

/** Screenshots a page or element at a viewport (guest context). */
async function shotGuest(browser, w, h, path, name, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(URL + path, { waitUntil: 'domcontentloaded' });
  if (opts.hideHeader)
    await page.addStyleTag({ content: 'app-landing-header{display:none}' });
  if (opts.click) await page.click(opts.click).catch(() => null);
  if (opts.waitFor)
    await page
      .waitForSelector(opts.waitFor, { timeout: 8000 })
      .catch(() => null);
  await page.waitForTimeout(500);
  const target = opts.sel ? page.locator(opts.sel) : page;
  if (opts.sel) await target.scrollIntoViewIfNeeded();
  await target.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full });
  await ctx.close();
}

/** Runs the activation flow and captures its screenshots + assertions. */
async function activationFlow(browser, email) {
  const { ctx, page } = await loginContext(browser, email, {
    width: 1440,
    height: 900,
  });
  check(
    'login without plan → /tarif-waehlen',
    /\/tarif-waehlen/.test(page.url()),
  );
  await page.waitForSelector('app-plan-tiers', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/plan-select.png`, fullPage: true });

  // annual + Creator → checkout
  await page.click('.bt__opt:has-text("Jährlich")');
  await page.waitForTimeout(200);
  await page.click('.lp-tier--hl button');
  await page.waitForURL(/\/checkout/, { timeout: 10000 }).catch(() => null);
  check(
    'plan+billing carried to checkout',
    /plan=creator/.test(page.url()) && /billing=annual/.test(page.url()),
  );
  await page.waitForSelector('.co__card', { timeout: 10000 });
  await page.screenshot({
    path: `${OUT}/checkout-summary.png`,
    fullPage: true,
  });

  check(
    'activation blocked until the checkbox is ticked',
    await page.isDisabled('.co__btn--full'),
  );
  await page.check('.co__check input');
  await page.waitForTimeout(150);
  check(
    'final button enabled after confirm',
    !(await page.isDisabled('.co__btn--full')),
  );
  await page.screenshot({
    path: `${OUT}/checkout-checked.png`,
    fullPage: true,
  });

  await page.click('.co__btn--full');
  await page.waitForURL(/\/studio/, { timeout: 20000 }).catch(() => null);
  check('activation opens the studio', /\/studio/.test(page.url()));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/studio-activated.png` });

  // landing header with active plan + account menu
  await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForSelector('.lh__account', { timeout: 10000 })
    .catch(() => null);
  await page.waitForTimeout(500);
  const headerText = await page.$eval('.lh', (e) => e.textContent ?? '');
  check(
    'logged-in header offers "Weiter zum Creator-Bereich"',
    /Weiter zum Creator-Bereich/.test(headerText),
  );
  await page.locator('.lh').screenshot({ path: `${OUT}/landing-creator.png` });
  await page.click('.lh__avatar');
  await page.waitForTimeout(200);
  await page.locator('.lh').screenshot({ path: `${OUT}/account-menu.png` });

  // konto with creator
  await page.goto(`${URL}/konto`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kt__card', { timeout: 10000 });
  await page.waitForTimeout(400);
  const kontoText = await page.$eval('.kt', (e) => e.textContent ?? '');
  check(
    'konto shows the active Creator test plan',
    /Creator/.test(kontoText) && /Testtarif aktiv/.test(kontoText),
  );
  await page.screenshot({ path: `${OUT}/konto-creator.png`, fullPage: true });
  await ctx.close();

  // relogin persists the plan → studio
  const relog = await loginContext(browser, email);
  check(
    'relogin with active plan reaches the studio',
    /\/studio/.test(relog.page.url()),
  );
  await relog.ctx.close();
}

await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const browser = await chromium.launch();

// guest screenshots
await shotGuest(browser, 1440, 900, '/', 'landing-logged-out', {
  sel: '.lh',
});
await shotGuest(browser, 1440, 900, '/login', 'login-desktop', {
  waitFor: '.auth__card',
  sel: '.auth__card',
});
await shotGuest(browser, 1440, 900, '/register', 'register-desktop', {
  waitFor: '.auth__card',
  sel: '.auth__card',
});
await shotGuest(browser, 1440, 900, '/', 'tarife-monthly', {
  hideHeader: true,
  sel: '#tarife',
});
await shotGuest(browser, 1440, 900, '/', 'tarife-annual', {
  hideHeader: true,
  click: '.bt__opt:has-text("Jährlich")',
  sel: '#tarife',
});

// a verified user without a plan: header + konto
const noPlan = `acc-noplan-${Date.now()}@example.com`;
await registerVerified(browser, noPlan);
{
  const { ctx, page } = await loginContext(browser, noPlan, {
    width: 1440,
    height: 900,
  });
  await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForSelector('.lh__account', { timeout: 10000 })
    .catch(() => null);
  await page.waitForTimeout(400);
  const header = await page.$eval('.lh', (e) => e.textContent ?? '');
  check(
    'logged-in-no-plan header offers "Tarif wählen"',
    /Tarif wählen/.test(header),
  );
  await page.locator('.lh').screenshot({ path: `${OUT}/landing-noplan.png` });
  await page.goto(`${URL}/konto`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kt__card', { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/konto-noplan.png`, fullPage: true });
  // logout from landing returns to the guest header
  await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' });
  await page.click('.lh__avatar');
  await page.waitForTimeout(150);
  await page.click('.lh__item--btn');
  await page.waitForTimeout(600);
  const after = await page.$eval('.lh', (e) => e.textContent ?? '');
  check(
    'logout returns the guest header (Anmelden/Jetzt starten)',
    /Anmelden/.test(after) && /Jetzt starten/.test(after),
  );
  // mobile header logged-in (relogin, mobile)
  await ctx.close();
  const m = await loginContext(browser, noPlan, { width: 390, height: 844 });
  await m.page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' });
  await m.page
    .waitForSelector('.lh__account', { timeout: 10000 })
    .catch(() => null);
  await m.page.click('.lh__avatar');
  await m.page.waitForTimeout(200);
  await m.page.locator('.lh').screenshot({ path: `${OUT}/mobile-header.png` });
  await m.ctx.close();
}

// full activation flow with a fresh user
const buyer = `acc-buyer-${Date.now()}@example.com`;
await registerVerified(browser, buyer);
await activationFlow(browser, buyer);

await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
