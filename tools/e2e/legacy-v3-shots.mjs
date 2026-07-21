// Captures visual-acceptance screenshots of the public pages against a served
// build. Studio (post-login) screens require the Firebase emulator + dev build
// and are captured separately. Usage: SHOTS_URL=http://localhost:PORT node ...

import { mkdir } from 'node:fs/promises';

const TARGET_URL = process.env.SHOTS_URL ?? 'http://localhost:4320';
const OUT_DIR = 'artifacts/visual/legacy-v3-preview';

const SHOTS = [
  { name: 'landing-1440x900', path: '/', width: 1440, height: 900, full: true },
  {
    name: 'landing-1920x1080',
    path: '/',
    width: 1920,
    height: 1080,
    full: true,
  },
  { name: 'landing-390x844', path: '/', width: 390, height: 844, full: true },
  { name: 'landing-320x568', path: '/', width: 320, height: 568, full: true },
  {
    name: 'login-1440x900',
    path: '/login',
    width: 1440,
    height: 900,
    full: false,
  },
  {
    name: 'register-1440x900',
    path: '/register',
    width: 1440,
    height: 900,
    full: false,
  },
];

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
 * Captures one screenshot at a viewport.
 *
 * @param browser The launched browser.
 * @param shot The screenshot descriptor.
 */
async function capture(browser, shot) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
  });
  await page.goto(TARGET_URL + shot.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1900);
  await page.screenshot({
    path: `${OUT_DIR}/${shot.name}.png`,
    fullPage: shot.full,
  });
  await page.close();
  process.stdout.write(`saved ${OUT_DIR}/${shot.name}.png\n`);
}

/**
 * Captures all screenshots.
 *
 * @returns Process exit code (0 on success, 0 with a note when skipped).
 */
async function run() {
  const chromium = await loadChromium();
  if (!chromium) {
    process.stdout.write(
      'legacy-v3-shots — SKIPPED (Playwright not installed)\n',
    );
    return 0;
  }
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  for (const shot of SHOTS) await capture(browser, shot);
  await browser.close();
  return 0;
}

process.exit(await run());
