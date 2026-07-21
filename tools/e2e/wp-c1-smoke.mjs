// WP-C1 e2e smoke test (§12.4). Drives the served studio-web through the full
// chain: load DE demo -> preview visible -> edit markup -> preview updates ->
// trigger a warning -> warning visible -> switch language -> no console errors.
// Requires Playwright/Chromium and a served app (WP_C1_URL, default :4200).

const TARGET_URL = process.env.WP_C1_URL ?? 'http://localhost:4200';

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
 * Runs the WP-C1 smoke steps against the served app.
 *
 * @param page An open Playwright page.
 * @returns A list of failure messages (empty when the smoke passed).
 */
async function runSteps(page) {
  const failures = [];
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  if (!(await page.locator('.book-page').first().isVisible()))
    failures.push('preview not visible on load');
  if (!(await page.getByText('Selbstwert').first().isVisible()))
    failures.push('DE demo content missing');
  await page.fill('#markup-input', '# Legacy title\nA new paragraph.');
  await page.waitForTimeout(500);
  if (!(await page.getByText('Legacy title').first().isVisible()))
    failures.push('preview did not update after edit');
  if (!(await page.getByText('MW-H1-DEGRADE').first().isVisible()))
    failures.push('warning not shown for # heading');
  await page.getByRole('button', { name: 'English' }).click();
  await page.waitForTimeout(300);
  if (!(await page.getByText('self-worth').first().isVisible()))
    failures.push('EN demo did not load');
  return failures;
}

/**
 * Executes the smoke test and reports console errors.
 *
 * @returns Process exit code: 0 on success, 1 on any failure.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write(
      'test:wp-c1 — SKIPPED (Playwright/Chromium not installed)\n',
    );
    return 0;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on(
    'console',
    (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()),
  );
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  const failures = await runSteps(page);
  await browser.close();
  for (const error of consoleErrors)
    process.stdout.write(`console error: ${error}\n`);
  for (const failure of failures)
    process.stdout.write(`step failed: ${failure}\n`);
  const total = failures.length + consoleErrors.length;
  process.stdout.write(`test:wp-c1 — ${total} problem(s)\n`);
  return total === 0 ? 0 : 1;
}

process.exit(await run());
