// Shared seed for the Veröffentlichen (Step 8) e2e: a backup payload for a
// COMPLETE project (title, author, full chapters, scaffold, cover blurb + final
// page count, KDP results, pub config) so the pre-flight reads „Bereit ✓", plus
// the register→create→import flow that lands the app on the publishing step.
// Importing a backup is the reference-sanctioned way to seed saved data.

import { writeFile } from 'node:fs/promises';

const BODY =
  'Dieser Abschnitt enthält bewusst genügend Text, damit das jeweilige Kapitel eindeutig als vollständig gilt und die Pre-Flight-Prüfung keinen Hinweis auf ein fast leeres Kapitel ausgibt. Er beschreibt die Kernidee des Kapitels ausführlich, nennt konkrete Beispiele aus dem Alltag und fasst am Ende die wichtigsten Gedanken für die Leserin noch einmal knapp zusammen.';

/** Builds one non-empty chapter for the given index. */
function chapter(i) {
  return { id: `c${i}`, title: `Kapitel ${i}`, goal: '', content: BODY };
}

/** Builds the complete backup project payload used to seed Step 8. */
export function completeProject() {
  return {
    title: 'Genug',
    subtitle: 'Selbstwert nach toxischen Beziehungen',
    author: 'Mara Feld',
    promise: 'Du baust deinen Selbstwert von innen auf.',
    bookType: 'workbook',
    language: 'de',
    niche: 'Selbstwert stärken nach toxischen Beziehungen',
    outline: [1, 2, 3, 4, 5, 6, 7, 8].map(chapter),
    extras: {
      einleitung: BODY,
      arbeitsweise: BODY,
      schlusswort: BODY,
      autorin: BODY,
      bonus: BODY,
    },
    cover: {
      pageCount: 200,
      paper: 'cream',
      bg: '#2E2A3B',
      fg: '#F5F1E6',
      blurb:
        'Ein starker Klappentext für die Buchrückseite, der neugierig macht.',
      brief: '',
      imgPrompt: '',
      imageUrl: '',
    },
    settings: {
      trim: '7x10',
      pages: '151-300',
      font: 'garamond',
      fontSize: 11.5,
      lineHeight: 1.55,
      align: 'justify',
      wordTarget: 1200,
    },
    pub: { binding: 'paperback', price: 12.99, ebookPrice: 4.99, checks: {} },
    kdp: {
      beschreibung:
        'Fühlst du dich nie genug? Dieses Workbook zeigt dir Schritt für Schritt, wie du deinen Selbstwert von innen aufbaust.',
      keywords: [
        'selbstwert stärken',
        'toxische beziehung',
        'grenzen setzen',
        'selbstliebe lernen',
        'achtsamkeit journal',
        'workbook frauen',
        'emotionale heilung',
      ],
      kategorien: ['Ratgeber > Lebenshilfe & Psychologie'],
    },
  };
}

/**
 * Writes a backup file that seeds the complete project and returns its path.
 *
 * @param path The output backup path.
 * @returns The written path.
 */
export async function writeCompleteBackup(path) {
  const backup = {
    app: 'kdp-masterpeace',
    schema: 1,
    exportedAt: new Date().toISOString(),
    step: 7,
    activeChapter: 0,
    project: completeProject(),
  };
  await writeFile(path, JSON.stringify(backup));
  return path;
}

/**
 * Registers a user, creates a project, imports the seed and opens Step 8.
 *
 * @param page The Playwright page.
 * @param targetUrl The dev-server URL.
 * @param seedPath The seed backup file path.
 */
export async function seedPublish(page, targetUrl, seedPath) {
  await page.goto(`${targetUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', `pub-${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/studio/, { timeout: 15000 });
  const create = page.locator('button:has-text("Neues Buchprojekt")');
  if (await create.count()) await create.first().click();
  await page.waitForSelector('.rail-step:not([disabled])', { timeout: 15000 });
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
