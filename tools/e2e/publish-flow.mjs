// Functional flow test for Step 8 (Veröffentlichen): pre-flight errors on an
// empty project, „Bereit ✓" on a complete seed, the price calculator (paperback
// values, 70 %→35 % e-book switch, hardcover warning + values), the 9-step upload
// guide (partial progress, 9/9, copy buttons), reload persistence, the rail
// „done" tick at 9/9 and mobile. Usage: SHOTS_URL=… node tools/e2e/publish-flow.mjs

import { mkdir } from 'node:fs/promises';
import { writeCompleteBackup } from './publish-seed.mjs';

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

/** Reads the pre-flight badge text. */
async function badge(page) {
  return page.$eval('.pf-badge', (e) => e.textContent?.trim() ?? '');
}

/**
 * Registers a fresh (empty) project and opens the publishing step.
 *
 * @param page The Playwright page.
 */
async function openEmpty(page) {
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', `pub-empty-${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
  await page.click('.rail-step:has-text("Veröffentlichen")');
  await page.waitForSelector('.pf-badge', { timeout: 10000 });
}

/**
 * Checks the pre-flight error state of an empty project.
 *
 * @param page The Playwright page.
 */
async function checkErrors(page) {
  check('empty project shows an error badge', /Fehler/.test(await badge(page)));
  check(
    'shows the missing-title error row',
    (
      await page.$$eval('.pf-row.err', (rows) => rows.map((r) => r.textContent))
    ).some((t) => /Kein Titel/.test(t ?? '')),
  );
  check(
    'renders the non-checkable-PDF hint',
    /KDP-Previewer/.test(
      await page.$eval('.panel', (e) => e.textContent ?? ''),
    ),
  );
}

/**
 * Imports the complete backup over the current project and reopens Step 8.
 *
 * @param page The Playwright page.
 * @param seedPath The complete-backup file path.
 */
async function importComplete(page, seedPath) {
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
  await page.click('.rail-step:has-text("Veröffentlichen")');
  await page.waitForSelector('.pf-badge', { timeout: 10000 });
  await page.waitForTimeout(400);
}

/**
 * Checks the „Bereit ✓" state of the complete seed.
 *
 * @param page The Playwright page.
 */
async function checkReady(page) {
  check('complete project reads „Bereit"', /Bereit/.test(await badge(page)));
  check(
    'every pre-flight row is ok',
    (await page.$$('.pf-row.err')).length === 0 &&
      (await page.$$('.pf-row.warn')).length === 0,
  );
}

/**
 * Checks the price calculator (paperback + e-book royalty rate switch).
 *
 * @param page The Playwright page.
 */
async function checkPrice(page) {
  const dims = await page.$eval(
    '.card:has-text("Preis-Kalkulator") .dims',
    (e) => e.textContent ?? '',
  );
  check('shows the print cost row', /Druckkosten/.test(dims));
  check('shows the minimum list price', /Mindest-Listenpreis/.test(dims));
  check('e-book at 4,99 € uses the 70 % rate', /70 %/.test(dims));
  await page.fill('#pub-ebook', '12.99');
  await page.waitForTimeout(200);
  check(
    'e-book at 12,99 € drops to the 35 % rate',
    /35 %/.test(
      await page.$eval(
        '.card:has-text("Preis-Kalkulator") .dims',
        (e) => e.textContent ?? '',
      ),
    ),
  );
}

/**
 * Switches to hardcover and checks the warning + updated values.
 *
 * @param page The Playwright page.
 */
async function checkHardcover(page) {
  await page.selectOption('#pub-binding', 'hardcover');
  await page.waitForTimeout(200);
  check(
    'hardcover shows the cover-template warning',
    /Hardcover-Cover haben zusätzliche/.test(
      await page.$eval(
        '.card:has-text("Preis-Kalkulator")',
        (e) => e.textContent ?? '',
      ),
    ),
  );
  await page.selectOption('#pub-binding', 'paperback');
  await page.waitForTimeout(150);
}

/**
 * Checks the upload guide: partial progress, 9/9 and a copy button.
 *
 * @param page The Playwright page.
 */
async function checkGuide(page) {
  const card = page.locator('.card:has-text("Upload-Anleitung")');
  check(
    'starts at 0/9 erledigt',
    /0\/9 erledigt/.test(await card.textContent()),
  );
  const buttons = page.locator('.guide-check');
  await buttons.nth(0).click();
  await page.waitForTimeout(150);
  check(
    'one check reads 1/9 erledigt',
    /1\/9 erledigt/.test(await card.textContent()),
  );
  const count = await buttons.count();
  for (let i = 1; i < count; i += 1) await buttons.nth(i).click();
  await page.waitForTimeout(200);
  check(
    'all checks read 9/9 erledigt',
    /9\/9 erledigt/.test(await card.textContent()),
  );
  await page.click('.guide:has-text("Buchdetails") button:has-text("Titel")');
  check('copies the title from the guide', (await clip(page)) === 'Genug');
}

/**
 * Reloads and asserts 9/9 persists and the rail step is marked done.
 *
 * @param page The Playwright page.
 */
async function checkPersist(page) {
  await page.waitForSelector('.rail-save:has-text("Gespeichert")', {
    timeout: 10000,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pf-badge', { timeout: 15000 });
  await page.waitForSelector('.card:has-text("Upload-Anleitung")', {
    timeout: 15000,
  });
  await page.waitForTimeout(400);
  check(
    'reload keeps 9/9 erledigt',
    /9\/9 erledigt/.test(
      await page.$eval(
        '.card:has-text("Upload-Anleitung")',
        (e) => e.textContent ?? '',
      ),
    ),
  );
  check(
    'rail marks „Veröffentlichen" done at 9/9',
    !!(await page.$('.rail-step:has-text("Veröffentlichen") svg')),
  );
}

/**
 * Asserts no horizontal overflow at mobile width.
 *
 * @param page The Playwright page.
 */
async function checkMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  check('mobile has no horizontal overflow', overflow <= 1);
}

await mkdir(ART, { recursive: true });
const seedPath = await writeCompleteBackup(`${ART}/publish-seed.json`);
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
await openEmpty(page);
await checkErrors(page);
await importComplete(page, seedPath);
await checkReady(page);
await checkPrice(page);
await checkHardcover(page);
await checkGuide(page);
await checkPersist(page);
await checkMobile(page);
await context.close();
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
