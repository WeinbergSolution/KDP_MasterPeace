// Captures visual-acceptance screenshots of Step 2 (Gliederung) against the dev
// build wired to the Firebase emulator. Registers a throwaway emulator user,
// creates a project, seeds a title + an imported outline so the full layout is
// visible, opens the Gliederung step and shots it at desktop + mobile.
// Usage: SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/gliederung-shots.mjs

import { mkdir } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const OUT_DIR = 'artifacts/visual/parity';
const EMAIL = `gliederung-${Date.now()}@example.com`;
const PASSWORD = 'Test1234!';

const SAMPLE = [
  'Warum Gewohnheiten zählen',
  'Kleine Schritte, große Wirkung. Der Einstieg in das Thema und was dich erwartet.',
  '===',
  'Der Auslöser',
  'Jede Gewohnheit beginnt mit einem Auslöser, der eine Routine in Gang setzt.',
  '===',
  'Die Belohnung',
  'Am Ende steht die Belohnung, die das Verhalten im Gehirn verankert.',
].join('\n');

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
 * Registers a fresh emulator user and lands in the studio.
 *
 * @param page The Playwright page.
 */
async function register(page) {
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
}

/**
 * Creates a project, seeds a title + imported outline, opens Gliederung.
 *
 * @param page The Playwright page.
 */
async function seedOutline(page) {
  await page.waitForSelector('.rail', { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) {
    await create.first().click();
  }
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Idee")');
  await page.fill('input#idea-title', 'Die Macht der Gewohnheit');
  await page.waitForTimeout(600);
  await page.click('.rail-step:has-text("Gliederung")');
  await page.waitForSelector('textarea#import-text', { timeout: 10000 });
  await page.fill('textarea#import-text', SAMPLE);
  await page.click('button:has-text("In Kapitel aufteilen")');
  await page.waitForSelector('.chrow', { timeout: 10000 });
  await page.waitForTimeout(800);
}

/**
 * Captures the Gliederung step at one viewport.
 *
 * @param browser The launched browser.
 * @param label The screenshot label.
 * @param width The viewport width.
 * @param height The viewport height.
 */
async function shot(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await register(page);
  await seedOutline(page);
  await page.screenshot({
    path: `${OUT_DIR}/gliederung-${label}.png`,
    fullPage: true,
  });
  await page.close();
  process.stdout.write(`saved ${OUT_DIR}/gliederung-${label}.png\n`);
}

/**
 * Captures desktop + mobile Gliederung screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write(
      'gliederung-shots — SKIPPED (Playwright not installed)\n',
    );
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
