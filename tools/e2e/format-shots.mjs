// Captures visual-acceptance screenshots of Step 4 (Formatierung) against the
// dev build + Firebase emulator: registers a user, creates a project, opens
// Formatierung (the preview uses the reference SAMPLE when the first chapter is
// empty) and shots the default view, a clearly-changed view (large 8.5x11 trim +
// 14 pt + Lora font), and mobile. Usage: SHOTS_URL=... node tools/e2e/format-shots.mjs

import { mkdir } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const OUT_DIR = 'artifacts/visual/parity';
const PASSWORD = 'Test1234!';

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
 * Registers a user, creates a project and opens Formatierung.
 *
 * @param page The Playwright page.
 */
async function openFormat(page) {
  const email = `format-${Date.now()}@example.com`;
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Formatierung")');
  await page.waitForSelector('#fmt-trim', { timeout: 10000 });
  await page.waitForSelector('.page-inner .ast-box--exercise', {
    timeout: 10000,
  });
}

/**
 * Applies a clearly-different format (large trim, big font, other typeface).
 *
 * @param page The Playwright page.
 */
async function applyChanges(page) {
  await page.selectOption('#fmt-trim', '8.5x11');
  await page.selectOption('#fmt-font', 'lora');
  await page.selectOption('#fmt-align', 'left');
  await page.fill('#fmt-size', '14');
  await page.fill('#fmt-line', '1.9');
  await page.waitForTimeout(600);
}

/**
 * Captures the default + changed + (desktop only) views at one viewport.
 *
 * @param browser The launched browser.
 * @param label The viewport label.
 * @param width The viewport width.
 * @param height The viewport height.
 */
async function shot(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await openFormat(page);
  await page.screenshot({
    path: `${OUT_DIR}/format-${label}.png`,
    fullPage: true,
  });
  process.stdout.write(`saved ${OUT_DIR}/format-${label}.png\n`);
  if (label.startsWith('desktop')) {
    await applyChanges(page);
    await page.screenshot({
      path: `${OUT_DIR}/format-changed.png`,
      fullPage: true,
    });
    process.stdout.write(`saved ${OUT_DIR}/format-changed.png\n`);
  }
  await page.close();
}

/**
 * Captures desktop + mobile Formatierung screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write('format-shots — SKIPPED (Playwright not installed)\n');
    return 0;
  }
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  await shot(browser, 'desktop-1440x900', 1440, 900);
  await shot(browser, 'mobile-390x844', 390, 844);
  await browser.close();
  return 0;
}

process.exit(await run());
