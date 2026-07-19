// Functional flow test for Step 7 (KDP-Paket): empty state, seeded KDP results
// (description/keywords/categories) with copy, launch posts + 5 emails with copy,
// quote extraction + a real 1080×1080 PNG, the landing page, series planner +
// "Als Projekt anlegen" (source unchanged), reload persistence and mobile.
// Usage: SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/kdp-flow.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { writeSeedBackup } from './kdp-seed.mjs';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const ART = 'artifacts/e2e';
let failures = 0;

/**
 * Asserts a condition and records the outcome.
 *
 * @param label The step label.
 * @param cond The boolean condition.
 */
function check(label, cond) {
  process.stdout.write(`${cond ? 'PASS' : 'FAIL'}  ${label}\n`);
  if (!cond) failures += 1;
}

/** Reads the clipboard text. */
async function clip(page) {
  return page.evaluate(() => navigator.clipboard.readText());
}

/**
 * Registers a user and creates a project.
 *
 * @param page The Playwright page.
 */
async function register(page) {
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', `kdpflow-${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
}

/**
 * Checks the empty KDP state.
 *
 * @param page The Playwright page.
 */
async function checkEmpty(page) {
  await page.click('.rail-step:has-text("KDP-Paket")');
  await page.waitForSelector('button:has-text("Paket generieren")', {
    timeout: 10000,
  });
  check(
    'empty KDP hides the result cards',
    (await page.$$('.tags')).length === 0,
  );
  check(
    'empty KDP shows the quote-empty message',
    /Noch keine Merksätze gefunden/.test(
      await page.$eval('.panel', (e) => e.textContent ?? ''),
    ),
  );
}

/**
 * Imports the seed backup and returns to the KDP step.
 *
 * @param page The Playwright page.
 * @param seedPath The seed backup path.
 */
async function importSeed(page, seedPath) {
  await page.click('.rail-step:has-text("Export")');
  await page.waitForSelector('input[type="file"]', {
    state: 'attached',
    timeout: 10000,
  });
  await Promise.all([
    page.waitForEvent('download'),
    page.setInputFiles('input[type="file"]', seedPath),
  ]);
  await page.waitForTimeout(600);
  await page.click('.rail-step:has-text("KDP-Paket")');
  await page.waitForSelector('.tags', { timeout: 10000 });
}

/**
 * Checks the SEO results and their copy actions.
 *
 * @param page The Playwright page.
 */
async function checkResults(page) {
  check(
    'description renders as paragraphs',
    (await page.$$('.desc p')).length >= 2,
  );
  check('renders 7 keyword tags', (await page.$$('.tags .tag')).length === 7);
  check(
    'renders category suggestions',
    (await page.$$eval('.cl', (e) => e.map((x) => x.textContent))).some((t) =>
      /Ratgeber/.test(t ?? ''),
    ),
  );
  await page.click(
    '.card:has-text("Buchbeschreibung") button:has-text("Kopieren")',
  );
  check(
    'copies the description',
    (await clip(page)).includes('Fühlst du dich nie genug'),
  );
  await page.click(
    '.card:has-text("7 SEO-Keywords") button:has-text("Kopieren")',
  );
  const kw = await clip(page);
  check(
    'copies keywords semicolon-separated',
    kw.split(';').length === 7 && kw.includes('selbstwert stärken'),
  );
}

/**
 * Checks the launch kit (posts + emails) and their copy actions.
 *
 * @param page The Playwright page.
 */
async function checkLaunch(page) {
  check(
    'renders the content plan',
    /Content-Plan \(3 Tage\)/.test(
      await page.$eval(
        '.card:has-text("Launch-Kit")',
        (e) => e.textContent ?? '',
      ),
    ),
  );
  check('renders 5 email cards', (await page.$$('.persona')).length === 5);
  await page.click('button:has-text("Alle kopieren")');
  const posts = await clip(page);
  check(
    'copies all posts',
    posts.includes('Tag 1:') && posts.split('\n').length === 3,
  );
  await page.click(
    '.persona:nth-child(1) button:has-text("Kopieren"), .persona button:has-text("Kopieren")',
  );
  check(
    'copies a single email with subject',
    (await clip(page)).startsWith('Betreff:'),
  );
}

/**
 * Extracts quotes, generates a real PNG and validates its dimensions.
 *
 * @param page The Playwright page.
 */
async function checkQuotesPng(page) {
  const rows = await page.$$('.card:has-text("Zitat-Karten") .gap-row');
  check(
    'extracts quotes from > lines (deduped)',
    rows.length >= 2 && rows.length <= 12,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('.card:has-text("Zitat-Karten") button:has-text("PNG")'),
  ]);
  const path = `${ART}/test-zitat-karte.png`;
  await download.saveAs(path);
  const bytes = await readFile(path);
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  check('quote card is a real PNG', isPng);
  check(
    'quote card is 1080×1080',
    bytes.readUInt32BE(16) === 1080 && bytes.readUInt32BE(20) === 1080,
  );
}

/**
 * Opens the landing page and checks the required sections.
 *
 * @param page The Playwright page.
 */
async function checkLanding(page) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button:has-text("Vorschau öffnen")'),
  ]);
  await popup.waitForLoadState('load');
  const html = await popup.content();
  const parts = [
    'name="viewport"',
    'class="hero"',
    '[KAUF-LINK]',
    'class="benefits"',
    'class="probe"',
    'class="fade"',
    'class="signup"',
    '[IMPRESSUM-LINK]',
    '[DATENSCHUTZ-LINK]',
  ];
  check(
    'landing page contains all required sections',
    parts.every((p) => html.includes(p)),
  );
  await writeFile(`${ART}/test-landingpage.html`, html);
  await popup.close();
}

/**
 * Checks the series planner + "Als Projekt anlegen" (source unchanged).
 *
 * @param page The Playwright page.
 */
async function checkSeries(page) {
  const sourceUrl = page.url();
  check(
    'renders 2 series volumes',
    (await page.$$('.card:has-text("Serien-Planer") .gap-row')).length === 2,
  );
  await page.click('button:has-text("Als Projekt anlegen")');
  await page.waitForSelector('textarea#import-text', { timeout: 15000 });
  check(
    'series create opens the Gliederung step',
    !!(await page.$('textarea#import-text')),
  );
  check(
    'series create navigated to a different project',
    page.url() !== sourceUrl,
  );
  await page.click('.rail-step:has-text("Idee")');
  await page.waitForSelector('#idea-title', { timeout: 10000 });
  check(
    'new project inherits the band title',
    (await page.inputValue('#idea-title')) === 'Genug – Band 2',
  );
  check(
    'new project inherits the author (Autoren-DNA)',
    (await page.inputValue('#idea-author')) === 'Mara Feld',
  );
  await page.goto(sourceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("KDP-Paket")');
  await page.waitForSelector('.tags', { timeout: 10000 });
  check(
    'source project is unchanged (KDP data intact)',
    (await page.$$('.tags .tag')).length === 7,
  );
}

/**
 * Reloads and asserts kdp/launch/series were restored from Firestore.
 *
 * @param page The Playwright page.
 */
async function checkReload(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.tags', { timeout: 15000 });
  await page.waitForTimeout(400);
  check('reload restores keywords', (await page.$$('.tags .tag')).length === 7);
  check('reload restores emails', (await page.$$('.persona')).length === 5);
  check(
    'reload restores series',
    (await page.$$('.card:has-text("Serien-Planer") .gap-row')).length === 2,
  );
}

/**
 * Asserts no horizontal overflow at mobile width.
 *
 * @param page The Playwright page.
 */
async function checkMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check('mobile has no horizontal overflow', overflow <= 1);
}

await mkdir(ART, { recursive: true });
const seedPath = await writeSeedBackup(`${ART}/kdp-seed.json`);
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
await register(page);
await checkEmpty(page);
await importSeed(page, seedPath);
await checkResults(page);
await checkLaunch(page);
await checkQuotesPng(page);
await checkLanding(page);
await checkSeries(page);
await checkReload(page);
await checkMobile(page);
await context.close();
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
