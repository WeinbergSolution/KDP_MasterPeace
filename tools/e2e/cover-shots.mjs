// Visual-acceptance screenshots of Step 5 (Cover) against the dev build + Firebase
// emulator: registers a user, creates a titled project with a blurb, opens Cover,
// shots the full step (desktop + mobile) and a changed-colours/120-page variant,
// and captures the generated print-ready cover template (final + with guides) by
// intercepting the tab the app opens. Usage: SHOTS_URL=... node tools/e2e/cover-shots.mjs

import { mkdir } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const OUT_DIR = 'artifacts/visual/parity';
const PASSWORD = 'Test1234!';
const BLURB =
  'Fühlst du dich in Beziehungen oft nicht genug? Dieses Workbook zeigt dir in klaren Schritten, wie du deinen Selbstwert von innen aufbaust.\nMit Übungen, Reflexionsfragen und einem sanften, permission-gebenden Ton.';

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
 * Registers a user, seeds a titled project with a blurb and opens Cover.
 *
 * @param page The Playwright page.
 */
async function seed(page) {
  const email = `cover-${Date.now()}@example.com`;
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
  await page.click('.rail-step:has-text("Cover")');
  await page.waitForSelector('.dims', { timeout: 10000 });
  await page.fill('textarea.ta.short', BLURB);
  await page.locator('textarea.ta.short').blur();
  await page.waitForTimeout(400);
}

/**
 * Sets 120 pages and clearly different cover colours.
 *
 * @param page The Playwright page.
 */
async function applyChanges(page) {
  await page.fill('input#cover-pages', '120');
  await page.evaluate(() => {
    for (const [id, value] of [
      ['#cover-bg', '#7A2E3B'],
      ['#cover-fg', '#F7E9C8'],
    ]) {
      const el = document.querySelector(id);
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(500);
}

/**
 * Clicks a template button, screenshots the opened cover tab and closes it.
 *
 * @param page The seeded Cover page.
 * @param label The button label to click.
 * @param name The output file name.
 */
async function shotTemplate(page, label, name) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click(`button:has-text("${label}")`),
  ]);
  await popup.waitForLoadState('load');
  await popup.waitForTimeout(500);
  await popup.screenshot({ path: `${OUT_DIR}/${name}.png` });
  process.stdout.write(`saved ${OUT_DIR}/${name}.png\n`);
  await popup.close();
}

/**
 * Captures the full step (and, on desktop, the changed variant + templates).
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
    path: `${OUT_DIR}/cover-${label}.png`,
    fullPage: true,
  });
  process.stdout.write(`saved ${OUT_DIR}/cover-${label}.png\n`);
  if (label.startsWith('desktop')) {
    await shotTemplate(page, 'Cover öffnen (final)', 'cover-template-final');
    await shotTemplate(page, 'Mit Hilfslinien', 'cover-template-guides');
    await applyChanges(page);
    await page.screenshot({
      path: `${OUT_DIR}/cover-changed.png`,
      fullPage: true,
    });
    process.stdout.write(`saved ${OUT_DIR}/cover-changed.png\n`);
  }
  await context.close();
}

/**
 * Captures step + template screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write('cover-shots — SKIPPED (Playwright not installed)\n');
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
