// Visual + functional capture for the additive studio topbar. Seeds a verified
// user with an active Creator/annual test-phase entitlement (Admin SDK), logs in
// through the real guard, then captures the studio with the account bar closed /
// open (desktop + mobile), verifies no horizontal overflow on mobile, that the
// eight studio steps are unchanged, and that "Mein Konto" navigates to /konto.
//   SHOTS_URL=http://localhost:4220 node tools/e2e/studio-topbar-shots.mjs

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

import { mkdir } from 'node:fs/promises';
import admin from 'firebase-admin';

const URL = process.env.SHOTS_URL ?? 'http://localhost:4220';
const OUT = 'artifacts/visual/studio-topbar';
const PW = 'Test1234!';
let failures = 0;

/** Records a check result. */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

admin.initializeApp({ projectId: 'demo-kdp-masterpeace' });
const db = admin.firestore();
const email = `topbar-${Date.now()}@example.com`;
const user = await admin.auth().createUser({
  email,
  password: PW,
  displayName: 'Erika Mustermann',
  emailVerified: true,
});
const now = admin.firestore.FieldValue.serverTimestamp();
await db.doc(`entitlements/${user.uid}`).set({
  status: 'active',
  planId: 'creator',
  billingCycle: 'annual',
  bookLimit: 12,
  priceCents: 59000,
  source: 'test_phase',
  testMode: true,
  activatedAt: now,
  updatedAt: now,
});

await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const browser = await chromium.launch();

/** Logs the seeded user in and opens the studio in the given viewport. */
async function studio(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 }).catch(() => null);
  await page.waitForSelector('app-studio-topbar .stopbar', { timeout: 10000 });
  await page.waitForTimeout(500);
  return { ctx, page };
}

// Desktop: closed + open account menu.
{
  const { ctx, page } = await studio({ width: 1440, height: 900 });
  check(
    'active plan shown in the bar',
    /Creator · jährlich/.test(
      await page.$eval('.stopbar', (e) => e.textContent ?? ''),
    ),
  );
  check(
    'test-access note shown',
    /Testzugang/.test(await page.$eval('.stopbar', (e) => e.textContent ?? '')),
  );
  check(
    'eight studio steps unchanged',
    (await page.$$('.rail-step')).length === 8,
  );
  await page.screenshot({ path: `${OUT}/studio-desktop-closed.png` });
  await page.click('.stopbar__avatar');
  await page.waitForSelector('#studio-account-menu', { timeout: 5000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/studio-desktop-open.png` });

  // Mein Konto navigates to /konto.
  await page.click('.stopbar__item[href="/konto"]');
  await page.waitForURL(/\/konto/, { timeout: 10000 }).catch(() => null);
  check('“Mein Konto” navigates to /konto', /\/konto/.test(page.url()));
  await page.waitForSelector('.kt__card', { timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/nav-to-konto.png`, fullPage: true });
  await ctx.close();
}

// Mobile: header + open menu + no horizontal overflow.
{
  const { ctx, page } = await studio({ width: 390, height: 844 });
  await page.screenshot({ path: `${OUT}/studio-mobile-header.png` });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check(`no horizontal overflow on mobile (Δ=${overflow}px)`, overflow <= 1);
  await page.click('.stopbar__avatar');
  await page.waitForSelector('#studio-account-menu', { timeout: 5000 });
  await page.waitForTimeout(250);
  const menuRight = await page.evaluate(() => {
    const m = document.querySelector('#studio-account-menu');
    return m ? m.getBoundingClientRect().right : 0;
  });
  check(
    `menu stays within the viewport (right=${Math.round(menuRight)}px)`,
    menuRight <= 390,
  );
  await page.screenshot({ path: `${OUT}/studio-mobile-open.png` });
  await ctx.close();
}

await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
