// Full emulator-backed E2E for the KDP MasterPeace slice. Drives register →
// studio → create → edit → reload → writing preview → logout → login persists,
// asserting each step and capturing the required studio screenshots.

import { chromium } from 'playwright';

const BASE = process.env.E2E_URL ?? 'http://localhost:4340';
const OUT = 'artifacts/visual/legacy-v3-preview';
const email = `t${Date.now()}@example.com`;
const password = 'testpass123';
const results = [];
const consoleErrors = [];

const ok = (name, cond) => {
  results.push(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
  if (!cond) throw new Error('assertion failed: ' + name);
};

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.on(
    'console',
    (m) => m.type() === 'error' && consoleErrors.push(m.text()),
  );
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e)));

  // 1. Register
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('#reg-name', 'Test Autor');
  await page.fill('#reg-email', email);
  await page.fill('#reg-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/studio', { timeout: 15000 });
  ok('register redirects to /studio', page.url().includes('/studio'));

  // 2. Create project (empty state)
  await page.waitForSelector('.empty__btn, .switcher__select', {
    timeout: 10000,
  });
  if (await page.locator('.empty__btn').count())
    await page.click('.empty__btn');
  await page.waitForSelector('#idea-title', { timeout: 10000 });
  ok(
    'idea step visible after create',
    await page.locator('#idea-title').isVisible(),
  );

  // 3. Fill idea fields (autosaved)
  await page.selectOption('#idea-type', 'ratgeber');
  await page.selectOption('#idea-lang', 'en');
  await page.fill('#idea-niche-free', 'Selbstwert nach Trennung');
  await page.fill('#idea-title', 'Mein starkes Ich');
  await page.fill('#idea-author', 'Test Autor');
  await page.waitForTimeout(1200);
  ok(
    'save status shows saved',
    (await page.locator('.rail-save').textContent())?.includes('Gespeichert'),
  );
  await page.screenshot({ path: `${OUT}/studio-idea-1440x900.png` });

  // 4. Reload → project persists
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#idea-title', { timeout: 10000 });
  ok(
    'title persisted after reload',
    (await page.inputValue('#idea-title')) === 'Mein starkes Ich',
  );

  // 5. Writing step → WP-C1 preview
  await page.locator('.step-link').nth(2).click();
  await page.waitForSelector('#writing-input', { timeout: 10000 });
  await page.waitForSelector('.book-page', { timeout: 10000 });
  ok(
    'WP-C1 live preview renders (.book-page)',
    await page.locator('.book-page').first().isVisible(),
  );
  await page.screenshot({ path: `${OUT}/studio-writing-1440x900.png` });

  // 6. Studio (after login) full + mobile
  await page.screenshot({ path: `${OUT}/studio-after-login-1440x900.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/studio-mobile-390x844.png` });
  await page.setViewportSize({ width: 1440, height: 900 });

  // 7. Logout
  await page.goto(`${BASE}/account`, { waitUntil: 'domcontentloaded' });
  await page.click('.account__signout');
  await page.waitForURL(BASE + '/', { timeout: 10000 });
  ok(
    'logout returns to landing',
    page.url() === BASE + '/' || page.url() === BASE,
  );

  // 8. Login again → project persists
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/studio**', { timeout: 15000 });
  await page.waitForSelector('#idea-title', { timeout: 10000 });
  ok(
    'project persists after re-login',
    (await page.inputValue('#idea-title')) === 'Mein starkes Ich',
  );

  await browser.close();
};

try {
  await run();
  console.log(results.join('\n'));
  console.log(
    'console errors: ' +
      (consoleErrors.length ? consoleErrors.join(' | ') : 'NONE'),
  );
  console.log(
    consoleErrors.length === 0
      ? 'E2E_RESULT: GREEN'
      : 'E2E_RESULT: CONSOLE_ERRORS',
  );
} catch (e) {
  console.log(results.join('\n'));
  console.log('ERROR: ' + e.message);
  console.log('console errors: ' + consoleErrors.join(' | '));
  console.log('E2E_RESULT: FAILED');
  process.exit(1);
}
