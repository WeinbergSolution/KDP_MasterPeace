// Visual-acceptance screenshots of Step 6 (Export) against the dev build +
// Firebase emulator: registers a user, seeds a titled workbook with markup-rich
// chapters, opens Export and shots the full step (desktop + mobile), the quality
// check card, the digital-product configuration and the generated print interior.
// Usage: SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/export-shots.mjs

import { mkdir } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const OUT_DIR = 'artifacts/visual/parity';
const PASSWORD = 'Test1234!';

const BODY =
  'Dieser Absatz beschreibt ausführlich eine Idee und gibt ein konkretes ' +
  'Beispiel aus dem Alltag der Leserin sowie eine praktische Anleitung. ';
const chapter = (title, n) =>
  [
    `${title}. ${BODY.repeat(5)}`,
    `:::uebung Übung zu ${title}`,
    `Notiere ${n} Gedanken:`,
    '[linien:3]',
    '- [ ] Ich habe die Übung gemacht',
    '[skala] Wie klar fühlst du dich?',
    ':::',
  ].join('\n');
const OUTLINE = [
  chapter('Warum Gewohnheiten zählen', 3),
  '===',
  chapter('Der Auslöser', 2),
  '===',
  chapter('Die Belohnung', 4),
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
 * Registers a user, seeds a workbook project and opens Export.
 *
 * @param page The Playwright page.
 */
async function seed(page) {
  const email = `export-${Date.now()}@example.com`;
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Idee")');
  await page.fill('input#idea-title', 'Genug');
  await page.fill(
    'input#idea-subtitle',
    'Selbstwert nach toxischen Beziehungen',
  );
  await page.fill('input#idea-author', 'Mara Feld');
  await page.click('.rail-step:has-text("Gliederung")');
  await page.waitForSelector('textarea#import-text', { timeout: 10000 });
  await page.fill('textarea#import-text', OUTLINE);
  await page.click('button:has-text("In Kapitel aufteilen")');
  await page.waitForSelector('.chrow', { timeout: 10000 });
  await page.click('.rail-step:has-text("Export")');
  await page.waitForSelector('.qgrid', { timeout: 10000 });
  await page.waitForTimeout(400);
}

/**
 * Captures the full step (and, on desktop, the card + print screenshots).
 *
 * @param browser The launched browser.
 * @param label The viewport label.
 * @param width The viewport width.
 * @param height The viewport height.
 */
async function shotStep(browser, label, width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await seed(page);
  await page.screenshot({
    path: `${OUT_DIR}/export-${label}.png`,
    fullPage: true,
  });
  process.stdout.write(`saved ${OUT_DIR}/export-${label}.png\n`);
  if (label.startsWith('desktop')) {
    await page
      .locator('.card')
      .first()
      .screenshot({ path: `${OUT_DIR}/export-quality.png` });
    process.stdout.write(`saved ${OUT_DIR}/export-quality.png\n`);
    await page
      .locator('.card.exp:has-text("Digital-Produkt")')
      .screenshot({ path: `${OUT_DIR}/export-digital.png` });
    process.stdout.write(`saved ${OUT_DIR}/export-digital.png\n`);
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Print-Version öffnen")'),
    ]);
    await popup.waitForLoadState('load');
    await popup.waitForTimeout(600);
    await popup.screenshot({ path: `${OUT_DIR}/export-print-interior.png` });
    process.stdout.write(`saved ${OUT_DIR}/export-print-interior.png\n`);
    await popup.close();
  }
  await context.close();
}

/**
 * Captures the export screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write('export-shots — SKIPPED (Playwright not installed)\n');
    return 0;
  }
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  await shotStep(browser, 'desktop-1440x900', 1440, 900);
  await shotStep(browser, 'mobile-390x844', 390, 844);
  await browser.close();
  return 0;
}

process.exit(await run());
