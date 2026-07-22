// Reproduction/regression for the reported bug: an ACTIVE test_phase entitlement
// must open the studio through the real client Firestore read (guard), survive a
// reload and a direct deep-link, and be revoked when inactive/missing. Seeds the
// exact reported document (tester / one_time / test_phase / testMode) via the
// Admin SDK, then drives the browser login/guard against the emulator.
// Usage: SHOTS_URL=http://localhost:4220 node tools/e2e/entitlement-read-flow.mjs

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

import admin from 'firebase-admin';

const URL = process.env.SHOTS_URL ?? 'http://localhost:4220';
const PW = 'Test1234!';
let failures = 0;

/** Records a check result. */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

admin.initializeApp({ projectId: 'demo-kdp-masterpeace' });
const db = admin.firestore();
const email = `entread-${Date.now()}@example.com`;
const user = await admin
  .auth()
  .createUser({ email, password: PW, emailVerified: true });
const uid = user.uid;
const ref = db.doc(`entitlements/${uid}`);
const now = admin.firestore.FieldValue.serverTimestamp();

// The exact reported document.
await ref.set({
  status: 'active',
  planId: 'tester',
  billingCycle: 'one_time',
  bookLimit: 1,
  priceCents: 990,
  source: 'test_phase',
  testMode: true,
  activatedAt: now,
  updatedAt: now,
});

const { chromium } = await import('playwright');
const browser = await chromium.launch();

/** Logs in and returns { ctx, page, url }. */
async function login() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page
    .waitForURL(/\/(studio|tarif-waehlen|verify-email)/, { timeout: 15000 })
    .catch(() => null);
  return { ctx, page, url: page.url() };
}

let s = await login();
check(
  'active test_phase entitlement (tester/one_time) → studio',
  /\/studio/.test(s.url),
);
await s.page.reload({ waitUntil: 'domcontentloaded' });
await s.page.waitForURL(/\/studio/, { timeout: 10000 }).catch(() => null);
check('reload keeps studio access', /\/studio/.test(s.page.url()));
await s.page.goto(`${URL}/studio`, { waitUntil: 'domcontentloaded' });
await s.page.waitForTimeout(1500);
check(
  'direct /studio deep-link stays in studio',
  /\/studio/.test(s.page.url()),
);
await s.ctx.close();

await ref.set({ status: 'canceled' }, { merge: true });
s = await login();
check('canceled entitlement → not studio', !/\/studio/.test(s.url));
await s.ctx.close();

await ref.delete();
s = await login();
check('missing entitlement → /tarif-waehlen', /\/tarif-waehlen/.test(s.url));
await s.ctx.close();

await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
