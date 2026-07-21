// Functional flow test for Step 2 (Gliederung) against the dev build + Firebase
// emulator. Exercises every local operation the user asked to verify and checks
// Firestore persistence via a full page reload. Prints PASS/FAIL per step and
// exits non-zero on any failure. Usage: SHOTS_URL=http://127.0.0.1:4200 node ...

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const PASSWORD = 'Test1234!';
let failures = 0;

// Body well over the Legacy 80-word merge threshold, so import chapters stay
// separate (mergeShort would fold anything < 80 words into the previous chapter).
const SENTENCE =
  'Dieser Absatz beschreibt ausführlich eine Idee und gibt ein konkretes Beispiel ' +
  'aus dem Alltag der Leserin sowie eine kleine praktische Übung zum Mitmachen. ';

/** Long paragraph (>80 words) so import chapters do NOT auto-merge. */
const LONG = (n) => `Kapiteltext ${n}. ` + SENTENCE.repeat(8);

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
 * Registers, creates a project, sets a title and opens Gliederung.
 *
 * @param page The Playwright page.
 */
async function setup(page) {
  const email = `flow-${Date.now()}@example.com`;
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  await page.waitForSelector('.rail', { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Idee")');
  await page.fill('input#idea-title', 'Die Macht der Gewohnheit');
  await page.waitForTimeout(500);
  await page.click('.rail-step:has-text("Gliederung")');
  await page.waitForSelector('textarea#import-text', { timeout: 10000 });
}

/** Reads the current chapter titles in order. */
async function titles(page) {
  return page.$$eval('.chrow .inp:not(.small)', (els) =>
    els.map((e) => e.value),
  );
}

/**
 * Waits until the visible chapter-row count equals n (or times out).
 *
 * @param page The Playwright page.
 * @param n The expected row count.
 */
async function waitRows(page, n) {
  await page
    .waitForFunction(
      (count) => document.querySelectorAll('.chrow').length === count,
      n,
      { timeout: 6000 },
    )
    .catch(() => {});
}

/**
 * Waits until the debounced autosave has flushed ("Gespeichert" in the rail).
 *
 * @param page The Playwright page.
 */
async function waitSaved(page) {
  await page
    .waitForFunction(
      () => {
        const s = document.querySelector('.rail-save');
        return s && /Gespeichert/.test(s.textContent ?? '');
      },
      null,
      { timeout: 6000 },
    )
    .catch(() => {});
}

/**
 * Runs the full add/edit/move/merge/delete/import/reload sequence.
 *
 * @param page The Playwright page.
 */
async function flow(page) {
  const add = page.locator('button:has-text("Kapitel manuell hinzufügen")');
  await add.click();
  await waitRows(page, 1);
  await add.click();
  await waitRows(page, 2);
  await add.click();
  await waitRows(page, 3);
  check('addChapter x3 → 3 rows', (await page.$$('.chrow')).length === 3);

  const first = page.locator('.chrow').first();
  await first.locator('.inp').first().fill('Einleitung');
  await first.locator('.inp').first().dispatchEvent('change');
  await first.locator('.inp.small').fill('Leser abholen');
  await first.locator('.inp.small').dispatchEvent('change');
  await page.waitForTimeout(300);
  check('edit title', (await titles(page))[0] === 'Einleitung');

  // move row 1 down → Einleitung should move to index 1
  await first.locator('.ico').nth(1).click();
  await page.waitForTimeout(300);
  check('move down reorders', (await titles(page))[1] === 'Einleitung');

  // merge row 2 (Einleitung) up into row 1 → count 3 -> 2
  await page
    .locator('.chrow')
    .nth(1)
    .locator('.ico[title^="Mit vorherigem"]')
    .click();
  await waitRows(page, 2);
  check('mergeChapterUp → 2 rows', (await page.$$('.chrow')).length === 2);

  // delete last row → 2 -> 1
  await page.locator('.chrow').last().locator('.ico.danger').click();
  await waitRows(page, 1);
  check('removeChapter → 1 row', (await page.$$('.chrow')).length === 1);

  // === import with 3 long blocks (replace) → 3 rows. NB: arming changes the
  // button label, so target it by position (last row's first button), not text.
  const sample = [LONG(1), '===', LONG(2), '===', LONG(3)].join('\n');
  await page.fill('textarea#import-text', sample);
  const replace = page
    .locator('.card.import > div.row')
    .last()
    .locator('button')
    .first();
  await replace.click(); // arms confirm (outline not empty)
  await page.waitForTimeout(400);
  await replace.click(); // applies
  await waitRows(page, 3);
  const importCount = (await page.$$('.chrow')).length;
  process.stdout.write(`  (import produced ${importCount} rows)\n`);
  check('=== import → 3 rows', importCount === 3);

  // reload → Firestore persistence (wait for the debounced autosave to flush first)
  await waitSaved(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.waitForTimeout(1000);
  const stepAfter = await page
    .$eval('.rail-step.on', (e) => e.innerText.trim())
    .catch(() => '?');
  check(
    'reload keeps step Gliederung (currentStep persisted)',
    /Gliederung/.test(stepAfter),
  );
  await page.click('.rail-step:has-text("Gliederung")');
  await waitRows(page, 3);
  check(
    'reload persists 3 rows (Firestore)',
    (await page.$$('.chrow')).length === 3,
  );
}

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error')
    process.stdout.write(`  CONSOLE-ERR: ${m.text()}\n`);
});
await setup(page);
await flow(page);
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
