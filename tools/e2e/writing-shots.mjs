// Captures visual-acceptance screenshots of Step 3 (Schreiben) against the dev
// build wired to the Firebase emulator: registers a user, creates a project with
// a title, seeds a 3-chapter outline, opens Schreiben, types WP-C1 markup into
// the active chapter (so the live preview renders) and shots the full step +
// the editor/preview pair + the book scaffold, at desktop + mobile.
// Usage: SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/writing-shots.mjs

import { mkdir } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const OUT_DIR = 'artifacts/visual/parity';
const PASSWORD = 'Test1234!';

const BODY =
  'Dieser Absatz beschreibt ausführlich eine Idee und gibt ein konkretes ' +
  'Beispiel aus dem Alltag der Leserin sowie eine kleine praktische Übung zum ' +
  'Mitmachen und Ausprobieren im eigenen Tempo. ';
const OUTLINE = [
  'Warum Gewohnheiten zählen. ' + BODY.repeat(7),
  '===',
  'Der Auslöser. ' + BODY.repeat(7),
  '===',
  'Die Belohnung. ' + BODY.repeat(7),
].join('\n');

// WP-C1 markup exercising heading, bold, quote, list, checkbox, writing lines,
// scale, exercise box and tip box so the live preview shows every block type.
const MARKUP = [
  '## Der erste Auslöser',
  '',
  'Jede Gewohnheit beginnt mit einem **Auslöser**. Er ist der Funke, der die',
  'Routine in Gang setzt.',
  '',
  '> Kleine Schritte schlagen großen Vorsatz.',
  '',
  '- Beobachte deinen Alltag',
  '- Notiere jeden Auslöser',
  '',
  '- [ ] Heute einen Auslöser erkennen',
  '- [x] Notizbuch bereitlegen',
  '',
  ':::uebung Deine erste Beobachtung',
  'Wann tritt deine Gewohnheit auf?',
  '[linien:3]',
  ':::',
  '',
  ':::tipp',
  'Bleib neugierig statt streng mit dir.',
  ':::',
  '',
  '[skala] Wie stark ist dein Impuls gerade?',
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
 * Registers a user, seeds a titled 3-chapter project and opens Schreiben.
 *
 * @param page The Playwright page.
 */
async function seed(page) {
  const email = `writing-${Date.now()}@example.com`;
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Idee")');
  await page.fill('input#idea-title', 'Die Macht der Gewohnheit');
  await page.click('.rail-step:has-text("Gliederung")');
  await page.waitForSelector('textarea#import-text', { timeout: 10000 });
  await page.fill('textarea#import-text', OUTLINE);
  await page.click('button:has-text("In Kapitel aufteilen")');
  await page.waitForSelector('.chrow', { timeout: 10000 });
}

/**
 * Opens the second chapter and types markup, waiting for the live preview.
 *
 * @param page The Playwright page.
 */
async function writeChapter(page) {
  await page.click('.rail-step:has-text("Schreiben")');
  await page.waitForSelector('.writegrid textarea.ta', { timeout: 10000 });
  await page.click('.chtab:nth-child(2)');
  await page.fill('.writegrid textarea.ta', MARKUP);
  await page.waitForSelector('.page-inner .ast-heading', { timeout: 10000 });
  await page.waitForTimeout(800);
}

/**
 * Captures the full step and the editor/preview pair at one viewport.
 *
 * @param browser The launched browser.
 * @param label The viewport label.
 * @param width The viewport width.
 * @param height The viewport height.
 */
async function shot(browser, label, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await seed(page);
  await writeChapter(page);
  await page.screenshot({
    path: `${OUT_DIR}/writing-${label}.png`,
    fullPage: true,
  });
  process.stdout.write(`saved ${OUT_DIR}/writing-${label}.png\n`);
  if (label.startsWith('desktop')) {
    await page.locator('.writegrid').scrollIntoViewIfNeeded();
    await page.locator('.writegrid').screenshot({
      path: `${OUT_DIR}/writing-editor-preview.png`,
    });
    process.stdout.write(`saved ${OUT_DIR}/writing-editor-preview.png\n`);
    await page.locator('h2.sect').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT_DIR}/writing-scaffold.png` });
    process.stdout.write(`saved ${OUT_DIR}/writing-scaffold.png\n`);
  }
  await page.close();
}

/**
 * Captures desktop + mobile Schreiben screenshots.
 *
 * @returns Process exit code.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write(
      'writing-shots — SKIPPED (Playwright not installed)\n',
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
