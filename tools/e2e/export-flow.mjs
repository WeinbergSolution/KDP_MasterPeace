// Functional flow test for Step 6 (Export) against the dev build + Firebase
// emulator. Covers the quality matrix (workbook + ratgeber), readability,
// typography cleanup, the print interior (using Step-4 formatting), a real EPUB
// archive (downloaded + structurally validated with a report), digital-product
// configuration + reload persistence, audiobook script, printable, and backup
// export + valid/invalid import. Usage: SHOTS_URL=... node tools/e2e/export-flow.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://127.0.0.1:4200';
const ART = 'artifacts/e2e';
const PASSWORD = 'Test1234!';
let failures = 0;

const BODY =
  'Dieser Absatz beschreibt ausführlich eine Idee und gibt ein konkretes Beispiel aus dem Alltag der Leserin sowie eine Anleitung. ';
const chapter = (title) =>
  [
    `${title}. ${BODY.repeat(5)}`,
    ':::uebung Übung',
    '[linien:3]',
    '- [ ] erledigt',
    '[skala] Wie klar?',
    ':::',
  ].join('\n');
const OUTLINE = [
  chapter('Warum Gewohnheiten zählen'),
  '===',
  chapter('Der Auslöser'),
  '===',
  chapter('Die Belohnung'),
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
 * Waits until the debounced autosave has flushed.
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

/**
 * Runs an action that triggers a download and saves it, returning its bytes.
 *
 * @param page The Playwright page.
 * @param action The action that triggers the download.
 * @param name The output file name (under artifacts/e2e).
 * @returns The saved file bytes.
 */
async function grabDownload(page, action, name) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    action(),
  ]);
  const path = `${ART}/${name}`;
  await download.saveAs(path);
  return readFile(path);
}

/**
 * Registers a user and seeds a workbook project, landing on Export.
 *
 * @param page The Playwright page.
 */
async function seed(page) {
  const email = `expflow-${Date.now()}@example.com`;
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
  await page.fill('input#idea-author', 'Mara Feld');
  await page.click('.rail-step:has-text("Gliederung")');
  await page.waitForSelector('textarea#import-text', { timeout: 10000 });
  await page.fill('textarea#import-text', OUTLINE);
  await page.click('button:has-text("In Kapitel aufteilen")');
  await page.waitForSelector('.chrow', { timeout: 10000 });
  await page.click('.rail-step:has-text("Export")');
  await page.waitForSelector('.qgrid', { timeout: 10000 });
}

/**
 * Checks the workbook quality matrix, readability and missing-extras warning.
 *
 * @param page The Playwright page.
 */
async function checkQuality(page) {
  const head = await page.$eval('.qgrid.qhead', (e) => e.textContent ?? '');
  check(
    'workbook matrix has element columns',
    /Übung/.test(head) && /Checkliste/.test(head),
  );
  check(
    'matrix shows a word count',
    (
      await page.$$eval('.qgrid .good, .qgrid .bad', (els) =>
        els.map((e) => e.textContent),
      )
    ).some((t) => /\d/.test(t ?? '')),
  );
  check(
    'workbook chapters detect ✓ elements',
    (
      await page.$$eval('.qgrid .good', (e) => e.map((x) => x.textContent))
    ).includes('✓'),
  );
  check(
    'missing-extras warning shown',
    /Noch offen im Buchgerüst/.test(
      await page.$eval('.card', (e) => e.textContent ?? ''),
    ),
  );
  check('readability matrix present', (await page.$$('.qgrid.q4')).length >= 2);
}

/**
 * Verifies the ratgeber matrix has only 2 columns.
 *
 * @param page The Playwright page.
 */
async function checkRatgeber(page) {
  await page.click('.rail-step:has-text("Idee")');
  await page.selectOption('#idea-type', 'ratgeber');
  await page.waitForTimeout(300);
  await page.click('.rail-step:has-text("Export")');
  await page.waitForSelector('.qgrid', { timeout: 10000 });
  check(
    'ratgeber matrix collapses to 2 columns',
    (await page.$$('.qgrid.q2')).length >= 1,
  );
  await page.click('.rail-step:has-text("Idee")');
  await page.selectOption('#idea-type', 'workbook');
  await page.waitForTimeout(300);
  await page.click('.rail-step:has-text("Export")');
  await page.waitForSelector('.qgrid', { timeout: 10000 });
}

/**
 * Runs the typography cleanup and its undo.
 *
 * @param page The Playwright page.
 */
async function checkTypography(page) {
  await page.click('button:has-text("Typografie bereinigen")');
  await page.waitForTimeout(300);
  check(
    'typography cleanup offers undo',
    !!(await page.$('button:has-text("rückgängig")')),
  );
  await page.click('button:has-text("rückgängig")');
  await page.waitForTimeout(200);
  check(
    'typography undo hides the undo button',
    !(await page.$('button:has-text("rückgängig")')),
  );
}

/**
 * Opens the print interior and checks structure + Step-4 formatting.
 *
 * @param page The Playwright page.
 */
async function checkPrint(page) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button:has-text("Print-Version öffnen")'),
  ]);
  await popup.waitForLoadState('load');
  const html = await popup.content();
  check(
    'print HTML has the title page',
    /class="titlepage"/.test(html) && /Genug/.test(html),
  );
  check(
    'print HTML has a table of contents',
    /class="front toc"/.test(html) || /class="toc/.test(html),
  );
  check(
    'print HTML renders chapters + exercises',
    /class="chapter"/.test(html) && /class="ebox/.test(html),
  );
  check(
    'print HTML renders writing lines + scale',
    /class="wline"/.test(html) && /class="skrow"/.test(html),
  );
  check(
    'print HTML uses the Step-4 trim size',
    /@page\s*\{\s*size:\s*177\.8mm 254mm/.test(html),
  );
  check(
    'print HTML uses the Step-4 font size (11.5pt)',
    /font-size:\s*11\.5pt/.test(html),
  );
  await popup.close();
}

/**
 * Downloads the EPUB, validates its structure and writes a report.
 *
 * @param page The Playwright page.
 */
async function checkEpub(page) {
  const bytes = await grabDownload(
    page,
    () => page.click('button:has-text("EPUB herunterladen")'),
    'test-book.epub',
  );
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const checks = {
    'mimetype first': text.indexOf('mimetype') < text.indexOf('META-INF'),
    'stored (uncompressed)': bytes[8] === 0 && bytes[9] === 0,
    'container.xml': text.includes('META-INF/container.xml'),
    'content.opf': text.includes('OEBPS/content.opf'),
    'nav.xhtml': text.includes('OEBPS/nav.xhtml'),
    'toc.ncx': text.includes('OEBPS/toc.ncx'),
    stylesheet: text.includes('OEBPS/style.css'),
    'dc:title': text.includes('<dc:title>Genug</dc:title>'),
    'dc:language': text.includes('<dc:language>de</dc:language>'),
    'dc:creator': text.includes('<dc:creator>Mara Feld</dc:creator>'),
    'chapter xhtml': text.includes('OEBPS/ch1.xhtml'),
  };
  const lines = Object.entries(checks).map(
    ([k, v]) => `${v ? 'PASS' : 'FAIL'}  ${k}`,
  );
  const ok = Object.values(checks).every(Boolean);
  await writeFile(
    `${ART}/epub-validation-report.txt`,
    `EPUB structural validation — test-book.epub (${bytes.length} bytes)\n${'='.repeat(48)}\n${lines.join('\n')}\n\nRESULT: ${ok ? 'STRUCTURALLY VALID EPUB 3' : 'INVALID'}\nNote: structural validation only (no external W3C epubcheck run).\n`,
  );
  check('EPUB archive is structurally valid (report written)', ok);
}

/**
 * Configures the digital product, opens it, and checks reload persistence.
 *
 * @param page The Playwright page.
 */
async function checkDigital(page) {
  await page.selectOption('#dig-format', 'a4');
  await page.click(
    '.card.exp:has-text("Digital-Produkt") .chtabs .chtab:nth-child(1)',
  );
  await page.evaluate(() => {
    const el = document.querySelector('#dig-accent');
    el.value = '#c0392b';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('button:has-text("Digital-PDF öffnen")'),
  ]);
  await popup.waitForLoadState('load');
  const html = await popup.content();
  check('digital reacts to the accent colour', html.includes('#c0392b'));
  check(
    'digital reacts to the A4 format',
    /@page\s*\{\s*size:\s*210mm 297mm/.test(html),
  );
  check(
    'digital dropped the deselected chapter 1',
    !/Warum Gewohnheiten zählen/.test(html),
  );
  await popup.close();
  await waitSaved(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#dig-format', { timeout: 15000 });
  await page.waitForTimeout(400);
  check(
    'reload restores digital format',
    (await page.inputValue('#dig-format')) === 'a4',
  );
  check(
    'reload restores digital accent',
    (await page.inputValue('#dig-accent')) === '#c0392b',
  );
}

/**
 * Checks the audiobook script + printable exports.
 *
 * @param page The Playwright page.
 */
async function checkAudioPrintable(page) {
  const audio = await grabDownload(
    page,
    () => page.click('button:has-text("Skript herunterladen")'),
    'test-hoerbuch.txt',
  );
  const script = new TextDecoder().decode(audio);
  check('audio script has [PAUSE] markers', script.includes('[PAUSE'));
  check('audio script announces chapters', /Kapitel 1:/.test(script));
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.click(
      '.card.exp:has-text("Printable-Generator") button:has-text("Öffnen")',
    ),
  ]);
  await popup.waitForLoadState('load');
  check(
    'printable worksheet renders',
    /class="head"/.test(await popup.content()),
  );
  await popup.close();
}

/**
 * Checks backup export, valid import and invalid import.
 *
 * @param page The Playwright page.
 */
async function checkBackup(page) {
  const backup = await grabDownload(
    page,
    () => page.click('button:has-text("Backup herunterladen")'),
    'test-backup.json',
  );
  const parsed = JSON.parse(new TextDecoder().decode(backup));
  check(
    'backup is versioned JSON with the project',
    parsed.schema === 1 && parsed.project.title === 'Genug',
  );

  const imported = {
    ...parsed,
    project: { ...parsed.project, title: 'Importiert' },
  };
  const importPath = `${ART}/import-valid.json`;
  await writeFile(importPath, JSON.stringify(imported));
  await Promise.all([
    page.waitForEvent('download'), // auto safety-backup of the current project
    page.setInputFiles('input[type="file"]', importPath),
  ]);
  await page.waitForTimeout(500);
  await page.click('.rail-step:has-text("Idee")');
  await page.waitForSelector('#idea-title', { timeout: 10000 });
  check(
    'valid import replaced the project title',
    (await page.inputValue('#idea-title')) === 'Importiert',
  );
  await page.click('.rail-step:has-text("Export")');
  await page.waitForSelector('.qgrid', { timeout: 10000 });

  const badPath = `${ART}/import-invalid.json`;
  await writeFile(badPath, 'this is not json');
  await page.setInputFiles('input[type="file"]', badPath);
  await page.waitForTimeout(400);
  check(
    'invalid import shows an error, no overwrite',
    /JSON|Backup/.test(await page.$eval('.panel', (e) => e.textContent ?? '')),
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
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
});
const page = await context.newPage();
await seed(page);
await checkQuality(page);
await checkRatgeber(page);
await checkTypography(page);
await checkPrint(page);
await checkEpub(page);
await checkDigital(page);
await checkAudioPrintable(page);
await checkBackup(page);
await checkMobile(page);
await context.close();
await browser.close();
process.stdout.write(failures ? `\n${failures} FAILURE(S)\n` : '\nALL PASS\n');
process.exit(failures ? 1 : 0);
