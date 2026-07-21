// Functional flow test for Step 3 (Schreiben) against the dev build + Firebase
// emulator. Covers: empty-outline state, chapter selection, manual markup entry,
// live preview + word-count updates, chapter switching with content retention,
// Firestore persistence of the active chapter + content across reload, WP-C1
// block rendering and mobile-overflow. Prints PASS/FAIL and exits non-zero on
// failure. Usage: SHOTS_URL=http://127.0.0.1:4200 node tools/e2e/writing-flow.mjs

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const PASSWORD = 'Test1234!';
let failures = 0;

const BODY =
  'Dieser Absatz beschreibt ausführlich eine Idee und gibt ein konkretes ' +
  'Beispiel aus dem Alltag der Leserin sowie eine kleine praktische Übung. ';
const OUTLINE = [
  'Erstes Kapitel. ' + BODY.repeat(7),
  '===',
  'Zweites Kapitel. ' + BODY.repeat(7),
  '===',
  'Drittes Kapitel. ' + BODY.repeat(7),
].join('\n');
const MARKUP = [
  '## Der erste Auslöser',
  '',
  'Jede Gewohnheit beginnt mit einem **Auslöser**.',
  '',
  '- [ ] Heute einen Auslöser erkennen',
  '',
  ':::uebung Beobachtung',
  '[linien:3]',
  ':::',
  '',
  '[skala] Wie stark ist dein Impuls?',
].join('\n');

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

/**
 * Waits until the debounced autosave has flushed ("Gespeichert" in the rail).
 *
 * @param page The Playwright page.
 */
async function waitSaved(page) {
  await page
    .waitForFunction(
      () =>
        /Gespeichert/.test(
          document.querySelector('.rail-save')?.textContent ?? '',
        ),
      null,
      { timeout: 6000 },
    )
    .catch(() => {});
}

/** Reads the editor word count as a number. */
async function wordCount(page) {
  const txt = await page
    .$eval('.writegrid .muted.small-t', (e) => e.textContent ?? '')
    .catch(() => '0');
  return parseInt(txt, 10) || 0;
}

/**
 * Registers a user, creates a project and lands in the studio.
 *
 * @param page The Playwright page.
 */
async function register(page) {
  const email = `wflow-${Date.now()}@example.com`;
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
}

/**
 * Verifies the empty-outline message in Schreiben.
 *
 * @param page The Playwright page.
 */
async function checkEmptyState(page) {
  await page.click('.rail-step:has-text("Schreiben")');
  await page.waitForTimeout(600);
  const text = await page.$eval('.main', (e) => e.textContent ?? '');
  check(
    'empty-outline message shown',
    text.includes('Noch keine Gliederung: Starte den Autopiloten oben'),
  );
}

/**
 * Seeds a 3-chapter outline via the Gliederung import.
 *
 * @param page The Playwright page.
 */
async function seedOutline(page) {
  await page.click('.rail-step:has-text("Gliederung")');
  await page.waitForSelector('textarea#import-text', { timeout: 10000 });
  await page.fill('textarea#import-text', OUTLINE);
  await page.click('button:has-text("In Kapitel aufteilen")');
  await page.waitForSelector('.chrow', { timeout: 10000 });
}

/**
 * Types markup into chapter 2 and asserts preview + word count.
 *
 * @param page The Playwright page.
 */
async function editChapter(page) {
  await page.click('.rail-step:has-text("Schreiben")');
  await page.waitForSelector('.writegrid textarea.ta', { timeout: 10000 });
  await page.click('.chtab:nth-child(2)');
  await page.waitForTimeout(300);
  await page.fill('.writegrid textarea.ta', MARKUP);
  await page.waitForSelector('.page-inner .ast-heading', { timeout: 8000 });
  check(
    'preview renders heading',
    !!(await page.$('.page-inner .ast-heading')),
  );
  check(
    'preview renders checkbox',
    !!(await page.$('.page-inner .ast-checkitem')),
  );
  check(
    'preview renders exercise box',
    !!(await page.$('.page-inner .ast-box--exercise')),
  );
  check('preview renders scale', !!(await page.$('.page-inner .ast-scale')));
  check('word count updated', (await wordCount(page)) > 0);
}

/**
 * Switches chapters and asserts content retention.
 *
 * @param page The Playwright page.
 */
async function switchChapters(page) {
  const ch2Words = await wordCount(page);
  await page.click('.chtab:nth-child(1)');
  await page.waitForTimeout(400);
  const ch1Value = await page.$eval('.writegrid textarea.ta', (e) => e.value);
  check(
    'chapter switch loads different content',
    !ch1Value.includes('Der erste Auslöser'),
  );
  await page.click('.chtab:nth-child(2)');
  await page.waitForTimeout(400);
  const ch2Value = await page.$eval('.writegrid textarea.ta', (e) => e.value);
  check(
    'switching back retains chapter 2 markup',
    ch2Value.includes('Der erste Auslöser'),
  );
  check(
    'word count restored on switch back',
    (await wordCount(page)) === ch2Words,
  );
}

/**
 * Reloads and asserts Firestore restored the active chapter + content.
 *
 * @param page The Playwright page.
 */
async function checkReload(page) {
  await waitSaved(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.writegrid textarea.ta', { timeout: 15000 });
  await page.waitForTimeout(800);
  const activeTab = await page
    .$eval('.chtab.on', (e) => e.textContent?.trim() ?? '')
    .catch(() => '');
  check('reload restores active chapter 2', activeTab.includes('2'));
  const value = await page.$eval('.writegrid textarea.ta', (e) => e.value);
  check(
    'reload restores chapter 2 content (Firestore)',
    value.includes('Der erste Auslöser'),
  );
  check(
    'reload re-renders preview blocks',
    !!(await page.$('.page-inner .ast-box--exercise')),
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

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await register(page);
await checkEmptyState(page);
await seedOutline(page);
await editChapter(page);
await switchChapters(page);
await checkReload(page);
await checkMobile(page);
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
