// Functional flow test for the entitlement gate (plan-gate-before-studio),
// against the Firebase Auth + Firestore emulators. Verifies: a verified user
// without an active entitlement is sent to /tarif-waehlen (never /studio); an
// 'active' entitlement (seeded server-side, bypassing rules) opens the studio;
// non-active states (past_due/pending/none) do not; the client cannot WRITE its
// entitlement (rules) but can READ it; deep-link blocking; and the tarif→checkout
// step. Also captures the screenshots.
// Usage: SHOTS_URL=http://localhost:4210 node tools/e2e/plan-gate-flow.mjs

import { mkdir } from 'node:fs/promises';

const URL = process.env.SHOTS_URL ?? 'http://localhost:4210';
const PROJECT = 'demo-kdp-masterpeace';
const AUTH = 'http://127.0.0.1:9099';
const EMU_OOB = `${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`;
const IDTK = `${AUTH}/identitytoolkit.googleapis.com/v1`;
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OUT = 'artifacts/visual/plan-gate';
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

/** Signs in via REST and returns { localId, idToken }. */
async function restSignIn(email) {
  const res = await fetch(`${IDTK}/accounts:signInWithPassword?key=demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PW, returnSecureToken: true }),
  });
  return res.json();
}

/** Writes an entitlement server-side (Bearer owner bypasses security rules). */
async function seedEntitlement(uid, status) {
  const body = {
    fields: {
      status: { stringValue: status },
      planId: { stringValue: 'creator' },
      source: { stringValue: 'e2e' },
    },
  };
  const res = await fetch(`${FS}/entitlements/${uid}`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.status;
}

/** Attempts a Firestore write as the signed-in user (expects denial). */
async function clientWrite(uid, idToken) {
  const res = await fetch(`${FS}/entitlements/${uid}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { status: { stringValue: 'active' } } }),
  });
  return res.status;
}

/** Reads the entitlement as the signed-in user (expects allowed). */
async function clientRead(uid, idToken) {
  const res = await fetch(`${FS}/entitlements/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return res.status;
}

/** Registers a user and verifies the address via the /auth/action handler. */
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

/** Logs in through the UI and returns the resulting URL. */
async function loginLandsOn(browser, email, viewport) {
  const ctx = await browser.newContext(viewport ? { viewport } : undefined);
  const page = await ctx.newPage();
  await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page
    .waitForURL(/\/(studio|tarif-waehlen|verify-email)/, { timeout: 15000 })
    .catch(() => null);
  const url = page.url();
  await ctx.close();
  return url;
}

/** Captures the plan-gate screenshots from a verified, logged-in session. */
async function screenshots(browser, email) {
  for (const [w, h, tag] of [
    [1440, 900, 'desktop-1440x900'],
    [390, 844, 'mobile-390x844'],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PW);
    await page.click('button[type="submit"]');
    await page
      .waitForURL(/\/tarif-waehlen/, { timeout: 15000 })
      .catch(() => null);
    await page
      .waitForSelector('app-plan-tiers', { timeout: 10000 })
      .catch(() => null);
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${OUT}/tarif-waehlen-${tag}.png`,
      fullPage: true,
    });
    await page.goto(`${URL}/checkout?plan=creator`, {
      waitUntil: 'domcontentloaded',
    });
    await page
      .waitForSelector('.co__card', { timeout: 10000 })
      .catch(() => null);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/checkout-creator-${tag}.png` });
    if (tag.startsWith('desktop')) {
      await page.goto(`${URL}/studio`, { waitUntil: 'domcontentloaded' });
      await page
        .waitForURL(/\/tarif-waehlen/, { timeout: 10000 })
        .catch(() => null);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `${OUT}/studio-blocked-${tag}.png`,
        fullPage: true,
      });
    }
    await ctx.close();
  }
}

await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const browser = await chromium.launch();

const email = `gate-${Date.now()}@example.com`;
await registerVerified(browser, email);
const { localId: uid, idToken } = await restSignIn(email);
check('obtained a uid + idToken for the verified user', !!uid && !!idToken);

// Guard: no entitlement → /tarif-waehlen (never studio).
check(
  'verified user without entitlement → /tarif-waehlen',
  /\/tarif-waehlen/.test(await loginLandsOn(browser, email)),
);

// Firestore rules: client cannot WRITE its entitlement, but can READ it.
// Seed the doc server-side first so the READ proves the rule allows it (a
// missing doc would be 404 = allowed-but-absent, not 403 = denied).
await seedEntitlement(uid, 'pending');
check(
  'client READ of own entitlement is allowed (200)',
  (await clientRead(uid, idToken)) === 200,
);
check(
  'client WRITE to entitlement is denied (403)',
  (await clientWrite(uid, idToken)) === 403,
);

// Active / trialing → studio; non-active → not studio.
for (const [status, expectStudio] of [
  ['active', true],
  ['trialing', true],
  ['pending', false],
  ['past_due', false],
  ['canceled', false],
]) {
  const code = await seedEntitlement(uid, status);
  const url = await loginLandsOn(browser, email);
  check(
    `entitlement '${status}' → ${expectStudio ? 'studio' : 'no studio'} (seed ${code})`,
    /\/studio/.test(url) === expectStudio,
  );
}

// Deep-link block: logged in, no active entitlement, direct /studio → /tarif-waehlen.
await seedEntitlement(uid, 'none');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page
    .waitForURL(/\/tarif-waehlen/, { timeout: 15000 })
    .catch(() => null);
  await page.goto(`${URL}/studio`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForURL(/\/tarif-waehlen/, { timeout: 10000 })
    .catch(() => null);
  check(
    'direct /studio deep-link without entitlement → /tarif-waehlen',
    /\/tarif-waehlen/.test(page.url()),
  );
  // tarif → checkout step
  await page.click('.lp-tier--hl button');
  await page.waitForURL(/\/checkout/, { timeout: 10000 }).catch(() => null);
  check(
    'choosing a plan routes to /checkout (not studio)',
    /\/checkout\?plan=creator/.test(page.url()),
  );
  await ctx.close();
}

await seedEntitlement(uid, 'none');
await screenshots(browser, email);
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
