// Visual-acceptance screenshots of Step 8 (Veröffentlichen): seeds a complete
// project via a backup import, then shots the full step (desktop + mobile), the
// pre-flight „Bereit ✓" card, the price calculator (paperback + hardcover with
// its warning) and the upload guide (empty + 9/9). The empty pre-flight-error
// state is shot from a fresh project. Usage:
// SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/publish-shots.mjs

import { mkdir } from 'node:fs/promises';
import { seedPublish, writeCompleteBackup } from './publish-seed.mjs';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const OUT_DIR = 'artifacts/visual/parity';

/**
 * Loads Playwright's Chromium launcher (null when unavailable).
 *
 * @returns The Chromium browser type, or null.
 */
async function loadChromium() {
  try {
    const { chromium } = await import('playwright');
    return chromium;
  } catch {
    return null;
  }
}

/**
 * Registers a fresh project and shots the pre-flight error state.
 *
 * @param browser The launched browser.
 */
async function shotErrors(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', `pub-err-${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Veröffentlichen")');
  await page.waitForSelector('.pf-badge', { timeout: 10000 });
  await page
    .locator('.card:has-text("Pre-Flight-Check")')
    .screenshot({ path: `${OUT_DIR}/publish-preflight-errors.png` });
  process.stdout.write(`saved ${OUT_DIR}/publish-preflight-errors.png\n`);
  await context.close();
}

/**
 * Shots the pre-flight „Bereit", the price cards and the upload guide.
 *
 * @param page The Playwright page (already on the seeded Step 8).
 */
async function shotSeededCards(page) {
  await page
    .locator('.card:has-text("Pre-Flight-Check")')
    .screenshot({ path: `${OUT_DIR}/publish-preflight-ready.png` });
  await page
    .locator('.card:has-text("Preis-Kalkulator")')
    .screenshot({ path: `${OUT_DIR}/publish-price-paperback.png` });
  await page.selectOption('#pub-binding', 'hardcover');
  await page.waitForTimeout(250);
  await page
    .locator('.card:has-text("Preis-Kalkulator")')
    .screenshot({ path: `${OUT_DIR}/publish-price-hardcover.png` });
  await page.selectOption('#pub-binding', 'paperback');
  await page.waitForTimeout(150);
  await page
    .locator('.card:has-text("Upload-Anleitung")')
    .screenshot({ path: `${OUT_DIR}/publish-guide-empty.png` });
  process.stdout.write(
    'saved preflight-ready / price-paperback / price-hardcover / guide-empty\n',
  );
}

/**
 * Ticks every guide step and shots the 9/9 upload guide.
 *
 * @param page The Playwright page.
 */
async function shotGuideDone(page) {
  const buttons = page.locator('.guide-check');
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) await buttons.nth(i).click();
  await page.waitForTimeout(300);
  await page
    .locator('.card:has-text("Upload-Anleitung")')
    .screenshot({ path: `${OUT_DIR}/publish-guide-done.png` });
  process.stdout.write(`saved ${OUT_DIR}/publish-guide-done.png\n`);
}

/**
 * Seeds Step 8 and captures the full step + its cards at a viewport.
 *
 * @param browser The launched browser.
 * @param seedPath The seed backup path.
 * @param label The viewport label.
 * @param width The viewport width.
 * @param height The viewport height.
 */
async function shot(browser, seedPath, label, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  await seedPublish(page, TARGET_URL, seedPath);
  await page.screenshot({
    path: `${OUT_DIR}/publish-${label}.png`,
    fullPage: true,
  });
  process.stdout.write(`saved ${OUT_DIR}/publish-${label}.png\n`);
  if (label.startsWith('desktop')) {
    await shotSeededCards(page);
    await shotGuideDone(page);
  }
  await context.close();
}

/**
 * Captures the Step 8 screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write(
      'publish-shots — SKIPPED (Playwright not installed)\n',
    );
    return 0;
  }
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir('artifacts/e2e', { recursive: true });
  const seedPath = await writeCompleteBackup('artifacts/e2e/publish-seed.json');
  const browser = await chromium.launch();
  await shotErrors(browser);
  await shot(browser, seedPath, 'desktop-1440x900', 1440, 900);
  await shot(browser, seedPath, 'mobile-390x844', 390, 844);
  await browser.close();
  return 0;
}

process.exit(await run());
