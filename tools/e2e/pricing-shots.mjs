// Visual + functional capture for the corrected tiered annual pricing. Captures
// the tariff section (monthly/annual desktop + annual mobile), the Creator and
// Pro annual checkout summaries and the annual Creator account view, and asserts
// the exact German figures (year price, discount, saving, monthly equivalent).
//   SHOTS_URL=http://localhost:4220 node tools/e2e/pricing-shots.mjs

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

import { mkdir } from 'node:fs/promises';
import admin from 'firebase-admin';

const URL = process.env.SHOTS_URL ?? 'http://localhost:4220';
const OUT = 'artifacts/visual/pricing';
const PW = 'Test1234!';
let failures = 0;

/** Records a check result. */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

admin.initializeApp({ projectId: 'demo-kdp-masterpeace' });
const db = admin.firestore();
const email = `pricing-${Date.now()}@example.com`;
const user = await admin.auth().createUser({
  email,
  password: PW,
  displayName: 'Erika Mustermann',
  emailVerified: true,
});

await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const browser = await chromium.launch();

/** Screenshots the tariff section at a viewport (optionally switched to annual). */
async function tariffShot(w, h, name, annual) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'app-landing-header{display:none}' });
  if (annual) await page.click('.bt__opt:has-text("Jährlich")');
  await page.waitForTimeout(400);
  await page.locator('#tarife').scrollIntoViewIfNeeded();
  await page.locator('#tarife').screenshot({ path: `${OUT}/${name}.png` });
  if (annual) {
    const text = await page.$eval('#tarife', (e) => e.textContent ?? '');
    check(
      `${name}: Creator 601,80 + 15 %`,
      /601,80/.test(text) && /15 % sparen/.test(text),
    );
    check(
      `${name}: Pro 950,40 + 20 %`,
      /950,40/.test(text) && /20 % sparen/.test(text),
    );
    check(
      `${name}: monthly equivalents`,
      /50,15/.test(text) && /79,20/.test(text),
    );
  }
  await ctx.close();
}

/** Logs the seeded user in (own context) and returns the page. */
async function login(viewport) {
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

/** Captures an annual checkout and asserts its figures. */
async function checkoutShot(page, plan, name, expect) {
  await page.goto(`${URL}/checkout?plan=${plan}&billing=annual`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('.co__summary', { timeout: 10000 });
  await page.waitForTimeout(300);
  const text = await page.$eval('.co__card', (e) => e.textContent ?? '');
  check(`${name}: year price ${expect.price}`, text.includes(expect.price));
  check(`${name}: discount ${expect.pct}`, text.includes(expect.pct));
  check(`${name}: saving ${expect.save}`, text.includes(expect.save));
  check(
    `${name}: monthly equiv ${expect.perMonth}`,
    text.includes(expect.perMonth),
  );
  check(`${name}: test-phase note kept`, /kein Geld abgebucht/.test(text));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}

// Tariff sections (guest).
await tariffShot(1440, 900, 'tarife-monthly-desktop', false);
await tariffShot(1440, 900, 'tarife-annual-desktop', true);
await tariffShot(390, 844, 'tarife-annual-mobile', true);

// Creator + Pro annual checkout.
{
  const { ctx, page } = await login({ width: 1440, height: 900 });
  await checkoutShot(page, 'creator', 'checkout-creator-annual', {
    price: '601,80',
    pct: '15 %',
    save: '106,20 € pro Jahr',
    perMonth: '50,15 € pro Monat',
  });
  await checkoutShot(page, 'pro', 'checkout-pro-annual', {
    price: '950,40',
    pct: '20 %',
    save: '237,60 € pro Jahr',
    perMonth: '79,20 € pro Monat',
  });
  await ctx.close();
}

// Annual Creator account view.
{
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.doc(`entitlements/${user.uid}`).set({
    status: 'active',
    planId: 'creator',
    billingCycle: 'annual',
    bookLimit: 12,
    priceCents: 60180,
    source: 'test_phase',
    testMode: true,
    activatedAt: now,
    updatedAt: now,
  });
  const { ctx, page } = await login({ width: 1440, height: 900 });
  await page.goto(`${URL}/konto`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.kt__card', { timeout: 10000 });
  await page.waitForTimeout(300);
  const text = await page.$eval('.kt', (e) => e.textContent ?? '');
  check('konto: annual price 601,80 € / Jahr', /601,80 € \/ Jahr/.test(text));
  check(
    'konto: Jahresvorteil 15 % + 50,15',
    /15 % Rabatt/.test(text) && /50,15/.test(text),
  );
  await page.screenshot({
    path: `${OUT}/konto-creator-annual.png`,
    fullPage: true,
  });
  await ctx.close();
}

await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
