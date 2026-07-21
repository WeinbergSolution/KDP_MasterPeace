// Visual-acceptance screenshots of Step 7 (KDP-Paket): seeds saved KDP data via a
// backup import, then shots the full step (desktop + mobile), the KDP result
// cards, the Launch-Kit, the quote cards, the series planner and the generated
// landing page. Usage: SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/kdp-shots.mjs

import { mkdir } from 'node:fs/promises';
import { seedKdp, writeSeedBackup } from './kdp-seed.mjs';

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
 * Captures the full step (and, on desktop, the card + landing screenshots).
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
  await seedKdp(page, TARGET_URL, seedPath);
  await page.screenshot({
    path: `${OUT_DIR}/kdp-${label}.png`,
    fullPage: true,
  });
  process.stdout.write(`saved ${OUT_DIR}/kdp-${label}.png\n`);
  if (label.startsWith('desktop')) {
    await page
      .locator('.card:has-text("7 SEO-Keywords")')
      .screenshot({ path: `${OUT_DIR}/kdp-results.png` });
    await page
      .locator('.card:has-text("Launch-Kit")')
      .screenshot({ path: `${OUT_DIR}/kdp-launch.png` });
    await page
      .locator('.card:has-text("Zitat-Karten")')
      .screenshot({ path: `${OUT_DIR}/kdp-quotes.png` });
    await page
      .locator('.card:has-text("Serien-Planer")')
      .screenshot({ path: `${OUT_DIR}/kdp-series.png` });
    process.stdout.write(
      'saved kdp-results / kdp-launch / kdp-quotes / kdp-series\n',
    );
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Vorschau öffnen")'),
    ]);
    await popup.waitForLoadState('load');
    await popup.waitForTimeout(700);
    await popup.screenshot({
      path: `${OUT_DIR}/kdp-landing.png`,
      fullPage: true,
    });
    process.stdout.write(`saved ${OUT_DIR}/kdp-landing.png\n`);
    await popup.close();
  }
  await context.close();
}

/**
 * Captures the KDP screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write('kdp-shots — SKIPPED (Playwright not installed)\n');
    return 0;
  }
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir('artifacts/e2e', { recursive: true });
  const seedPath = await writeSeedBackup('artifacts/e2e/kdp-seed.json');
  const browser = await chromium.launch();
  await shot(browser, seedPath, 'desktop-1440x900', 1440, 900);
  await shot(browser, seedPath, 'mobile-390x844', 390, 844);
  await browser.close();
  return 0;
}

process.exit(await run());
