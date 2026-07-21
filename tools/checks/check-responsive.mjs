// AGENTS.md §11.6: every page must render without a horizontal page scrollbar
// at each mandatory viewport. Runs against a served app (RESPONSIVE_URL).
// Requires Playwright + a Chromium browser (installed in CI).

const VIEWPORTS = [
  { w: 320, h: 568 },
  { w: 360, h: 800 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 },
];

const TARGET_URL = process.env.RESPONSIVE_URL ?? 'http://localhost:4200';

/**
 * Dynamically loads Playwright's Chromium launcher, returning null when the
 * dependency or browser is unavailable so local runs can skip gracefully.
 *
 * @returns The Chromium browser type, or null when Playwright is unavailable.
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
 * Measures horizontal overflow for a single viewport by comparing the document
 * scroll width against the layout viewport width.
 *
 * @param page An open Playwright page.
 * @param viewport The viewport size to test.
 * @returns True when the page overflows horizontally at this viewport.
 */
async function overflowsAt(page, viewport) {
  await page.setViewportSize({ width: viewport.w, height: viewport.h });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
}

/**
 * Runs the responsive check across all mandatory viewports.
 *
 * @returns Process exit code: 0 when compliant or skipped, 1 on overflow.
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write(
      'check:responsive — SKIPPED (Playwright/Chromium not installed)\n',
    );
    return 0;
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const failures = [];
  for (const vp of VIEWPORTS)
    if (await overflowsAt(page, vp)) failures.push(`${vp.w}x${vp.h}`);
  await browser.close();
  for (const f of failures)
    process.stdout.write(`horizontal overflow at ${f} on ${TARGET_URL}\n`);
  process.stdout.write(`check:responsive — ${failures.length} violation(s)\n`);
  return failures.length === 0 ? 0 : 1;
}

process.exit(await run());
