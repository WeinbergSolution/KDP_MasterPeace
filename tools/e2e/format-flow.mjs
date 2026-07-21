// Functional flow test for Step 4 (Formatierung) against the dev build + Firebase
// emulator. Covers: every trim selectable + aspect ratio changes, gutter persists,
// every font selectable, alignment toggle, both sliders update label + preview,
// WP-C1 SAMPLE renders, reload restores all settings, mobile-overflow. Prints
// PASS/FAIL and exits non-zero on failure. Usage: SHOTS_URL=... node ...format-flow.mjs

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

/** Reads the inline style of the preview page element. */
async function pageStyle(page) {
  return page.$eval('.page', (e) => e.getAttribute('style') ?? '');
}

/**
 * Registers a user, creates a project and opens Formatierung.
 *
 * @param page The Playwright page.
 */
async function open(page) {
  const email = `fmtflow-${Date.now()}@example.com`;
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
}

/**
 * Asserts trim options change the preview aspect ratio.
 *
 * @param page The Playwright page.
 */
async function checkTrims(page) {
  const ratios = [];
  for (const key of ['5x8', '6x9', '7x10', '8.5x11']) {
    await page.selectOption('#fmt-trim', key);
    await page.waitForTimeout(150);
    const style = await pageStyle(page);
    ratios.push((style.match(/aspect-ratio:([^;]+)/) ?? [])[1]);
    check(
      `trim ${key} selectable`,
      (await page.inputValue('#fmt-trim')) === key,
    );
  }
  check('preview aspect ratio changes per trim', new Set(ratios).size === 4);
  check(
    'SAMPLE renders WP-C1 blocks',
    !!(await page.$('.page-inner .ast-box--exercise')),
  );
}

/**
 * Asserts fonts, alignment and both sliders update the preview.
 *
 * @param page The Playwright page.
 */
async function checkTypography(page) {
  await page.selectOption('#fmt-font', 'lora');
  await page.waitForTimeout(150);
  check('font applies to preview', (await pageStyle(page)).includes('Lora'));

  await page.selectOption('#fmt-align', 'left');
  await page.waitForTimeout(150);
  const alignLeft = await page.$eval(
    '.page-inner .ast-paragraph',
    (e) => getComputedStyle(e).textAlign,
  );
  check('alignment (left) reaches the prose', alignLeft === 'left');
  await page.selectOption('#fmt-align', 'justify');
  await page.waitForTimeout(150);
  const alignJustify = await page.$eval(
    '.page-inner .ast-paragraph',
    (e) => getComputedStyle(e).textAlign,
  );
  check('alignment (justify) reaches the prose', alignJustify === 'justify');
  await page.selectOption('#fmt-align', 'left');

  await page.fill('#fmt-size', '14');
  await page.waitForTimeout(150);
  const sizeLabel = await page.$eval(
    'label[for="fmt-size"]',
    (e) => e.textContent ?? '',
  );
  check('font-size label updates', sizeLabel.includes('14'));
  const fontPx = await page.$eval('.page', (e) => getComputedStyle(e).fontSize);
  check('font-size applies to preview', fontPx === '14.7px');

  await page.fill('#fmt-line', '1.9');
  await page.waitForTimeout(150);
  const lineLabel = await page.$eval(
    'label[for="fmt-line"]',
    (e) => e.textContent ?? '',
  );
  check('line-height label updates', lineLabel.includes('1.9'));
  check(
    'line-height applies to preview',
    (await pageStyle(page)).includes('line-height: 1.9'),
  );
}

/**
 * Sets the gutter, reloads and asserts every setting is restored from Firestore.
 *
 * @param page The Playwright page.
 */
async function checkReload(page) {
  await page.selectOption('#fmt-pages', '301-500');
  await waitSaved(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#fmt-trim', { timeout: 15000 });
  await page.waitForTimeout(400);
  check(
    'reload restores trim',
    (await page.inputValue('#fmt-trim')) === '8.5x11',
  );
  check(
    'reload restores gutter',
    (await page.inputValue('#fmt-pages')) === '301-500',
  );
  check(
    'reload restores font',
    (await page.inputValue('#fmt-font')) === 'lora',
  );
  check(
    'reload restores alignment',
    (await page.inputValue('#fmt-align')) === 'left',
  );
  check(
    'reload restores font size',
    (await page.inputValue('#fmt-size')) === '14',
  );
  check(
    'reload restores line height',
    (await page.inputValue('#fmt-line')) === '1.9',
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
await open(page);
await checkTrims(page);
await checkTypography(page);
await checkReload(page);
await checkMobile(page);
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
