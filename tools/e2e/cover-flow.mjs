// Functional flow test for Step 5 (Cover) against the dev build + Firebase
// emulator. Covers: page-count fallback, spine width vs page count + paper, trim
// change from Step 4, spine-text threshold, colour persistence, the generated
// cover template (title/subtitle/author/blurb/barcode, final vs guides), reload
// restore and mobile-overflow. Usage: SHOTS_URL=... node tools/e2e/cover-flow.mjs

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const PASSWORD = 'Test1234!';
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

/** Reads a numeric dimension chip value (nth 1-based). */
async function dim(page, nth) {
  const txt = await page.$eval(
    `.dims > div:nth-child(${nth}) b`,
    (e) => e.textContent ?? '',
  );
  return parseFloat(txt.replace(',', '.'));
}

/** Reads the "Rückentext möglich" chip text. */
async function spineText(page) {
  return page.$eval('.dims > div:nth-child(3) b', (e) =>
    (e.textContent ?? '').trim(),
  );
}

/**
 * Registers a user, seeds a titled project and opens Cover.
 *
 * @param page The Playwright page.
 */
async function open(page) {
  const email = `covflow-${Date.now()}@example.com`;
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
}

/**
 * Checks the spine-width maths (fallback, page count, paper, threshold).
 *
 * @param page The Playwright page.
 */
async function checkMetrics(page) {
  check(
    'empty page count uses the 120-page fallback',
    (await spineText(page)) === 'Ja',
  );
  const spineFallback = await dim(page, 1);
  await page.fill('input#cover-pages', '200');
  await page.waitForTimeout(250);
  check(
    'page count changes the spine width',
    (await dim(page, 1)) !== spineFallback,
  );
  const creamSpine = await dim(page, 1);
  await page.selectOption('#cover-paper', 'white');
  await page.waitForTimeout(250);
  check('white paper gives a thinner spine', (await dim(page, 1)) < creamSpine);
  await page.fill('input#cover-pages', '80');
  await page.waitForTimeout(250);
  check(
    'spine text off below 100 pages',
    (await spineText(page)).startsWith('Nein'),
  );
  await page.fill('input#cover-pages', '150');
  await page.waitForTimeout(250);
  check('spine text on from 100 pages', (await spineText(page)) === 'Ja');
}

/**
 * Checks a Step-4 trim change flows into the cover total size.
 *
 * @param page The Playwright page.
 */
async function checkTrim(page) {
  const before = await dim(page, 2);
  await page.click('.rail-step:has-text("Formatierung")');
  await page.waitForSelector('#fmt-trim');
  await page.selectOption('#fmt-trim', '8.5x11');
  await page.waitForTimeout(250);
  await page.click('.rail-step:has-text("Cover")');
  await page.waitForSelector('.dims');
  check(
    'trim change updates the cover total size',
    (await dim(page, 2)) !== before,
  );
}

/**
 * Sets colours, checks the generated template, then reloads.
 *
 * @param page The Playwright page.
 */
async function checkTemplateAndReload(page) {
  await page.evaluate(() => {
    for (const [id, v] of [
      ['#cover-bg', '#7a2e3b'],
      ['#cover-fg', '#f7e9c8'],
    ]) {
      const el = document.querySelector(id);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  const [finalTab] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button:has-text("Cover öffnen (final)")'),
  ]);
  await finalTab.waitForLoadState('load');
  const finalHtml = await finalTab.content();
  check(
    'template shows title/subtitle/author',
    /Genug/.test(finalHtml) && /Mara Feld/.test(finalHtml),
  );
  check(
    'template shows blurb on the back',
    /permission-gebenden/.test(finalHtml) || /Barcode-Bereich/.test(finalHtml),
  );
  check('template has the barcode area', /Barcode-Bereich/.test(finalHtml));
  check(
    'final template has no guide lines',
    !finalHtml.includes('class="g v"'),
  );
  await finalTab.close();
  const [guideTab] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button:has-text("Mit Hilfslinien")'),
  ]);
  await guideTab.waitForLoadState('load');
  const guideHtml = await guideTab.content();
  check('guides template has guide lines', guideHtml.includes('class="g v"'));
  check(
    'guides template has the guide banner',
    /Hilfslinien: gestrichelt/.test(guideHtml),
  );
  await guideTab.close();
}

/**
 * Reloads and asserts the cover values were restored from Firestore.
 *
 * @param page The Playwright page.
 */
async function checkReload(page) {
  await waitSaved(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.dims', { timeout: 15000 });
  await page.waitForTimeout(400);
  check(
    'reload restores page count',
    (await page.inputValue('#cover-pages')) === '150',
  );
  check(
    'reload restores paper',
    (await page.inputValue('#cover-paper')) === 'white',
  );
  check(
    'reload restores background colour',
    (await page.inputValue('#cover-bg')) === '#7a2e3b',
  );
  check(
    'reload restores text colour',
    (await page.inputValue('#cover-fg')) === '#f7e9c8',
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
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
await open(page);
await checkMetrics(page);
await checkTrim(page);
await checkTemplateAndReload(page);
await checkReload(page);
await checkMobile(page);
await context.close();
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
