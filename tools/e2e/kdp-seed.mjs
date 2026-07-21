// Shared seed for the KDP-Paket (Step 7) e2e: a backup payload with saved KDP
// results, launch content, series plans and quote-bearing chapters, plus the
// register→create→import flow that lands the app on the KDP step. Importing a
// backup is the reference-sanctioned way to have „bereits gespeicherte" data
// without a provider.

import { writeFile } from 'node:fs/promises';

/** Builds the backup project payload used to seed the KDP step. */
export function seedProject() {
  const quotes =
    'Text zum Kapitel.\n> Du musst dich nicht beweisen, um wertvoll zu sein.\n> Kleine Schritte schlagen großen Vorsatz jeden einzelnen Tag.';
  return {
    title: 'Genug',
    subtitle: 'Selbstwert nach toxischen Beziehungen',
    author: 'Mara Feld',
    promise: 'Du baust deinen Selbstwert von innen auf.',
    bookType: 'workbook',
    language: 'de',
    niche: 'Selbstwert stärken nach toxischen Beziehungen',
    outline: [
      { id: 'c1', title: 'Warum Selbstwert zählt', goal: '', content: quotes },
      {
        id: 'c2',
        title: 'Der innere Kritiker',
        goal: '',
        content:
          'Text.\n> Beobachte deine Gedanken wie ein neugieriger Forscher.',
      },
    ],
    digital: {
      accent: '#7A2E3B',
      format: 'phone',
      fontSize: 14,
      align: 'left',
      withExtras: true,
      sel: {},
    },
    kdp: {
      beschreibung:
        'Fühlst du dich nie genug? Dieses Workbook zeigt dir Schritt für Schritt, wie du deinen Selbstwert von innen aufbaust.\nMit Übungen, Reflexionsfragen und einem sanften Ton begleitet es dich durch die wichtigsten Themen.',
      keywords: [
        'selbstwert stärken',
        'toxische beziehung',
        'grenzen setzen',
        'selbstliebe lernen',
        'achtsamkeit journal',
        'workbook frauen',
        'emotionale heilung',
      ],
      kategorien: [
        'Ratgeber > Lebenshilfe & Psychologie',
        'Selbsthilfe > Selbstwertgefühl',
        'Persönlichkeitsentwicklung',
      ],
    },
    launch: {
      posts: [
        { t: 1, idee: 'Teile deinen wichtigsten Merksatz aus Kapitel 1.' },
        { t: 2, idee: 'Frage deine Community nach ihrem inneren Kritiker.' },
        { t: 3, idee: 'Zeige eine Übungsseite aus dem Workbook.' },
      ],
      emails: [
        {
          tag: 0,
          betreff: 'Willkommen – deine Leseprobe',
          text: 'Hallo,\n\nschön, dass du da bist. Hier ist deine Gratis-Leseprobe.',
        },
        {
          tag: 2,
          betreff: 'Der innere Kritiker',
          text: 'Kennst du diese leise Stimme?\n\nHeute schauen wir sie uns an.',
        },
        {
          tag: 4,
          betreff: 'Eine kleine Übung',
          text: 'Nimm dir drei Minuten für diese Übung.',
        },
        {
          tag: 6,
          betreff: 'Warum Selbstwert trainierbar ist',
          text: 'Selbstwert ist keine Eigenschaft, sondern eine Fähigkeit.',
        },
        {
          tag: 8,
          betreff: 'Bereit für den nächsten Schritt?',
          text: 'Das komplette Workbook wartet auf dich.',
        },
      ],
    },
    series: [
      {
        titel: 'Genug – Band 2',
        untertitel: 'Grenzen setzen ohne Schuldgefühle',
        fokus: 'Gesunde Grenzen im Alltag',
        zielgruppe: 'Frauen 25–45',
        versprechen: 'Klare Grenzen, mehr Energie',
      },
      {
        titel: 'Genug – Band 3',
        untertitel: 'Beziehungen neu gestalten',
        fokus: 'Sichere Bindung aufbauen',
        zielgruppe: 'Frauen nach Trennung',
        versprechen: 'Vertrauen zurückgewinnen',
      },
    ],
  };
}

/** Writes a backup file that seeds the KDP data and returns its path. */
export async function writeSeedBackup(path, step = 6) {
  const backup = {
    app: 'kdp-masterpeace',
    schema: 1,
    exportedAt: new Date().toISOString(),
    step,
    activeChapter: 0,
    project: seedProject(),
  };
  await writeFile(path, JSON.stringify(backup));
  return path;
}

/**
 * Registers a user, creates a project, imports the seed backup and opens KDP.
 *
 * @param page The Playwright page.
 * @param targetUrl The dev-server URL.
 * @param seedPath The seed backup file path.
 */
export async function seedKdp(page, targetUrl, seedPath) {
  await page.goto(`${targetUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', `kdp-${Date.now()}@example.com`);
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
    page.waitForEvent('download'), // auto safety-backup of the empty project
    page.setInputFiles('input[type="file"]', seedPath),
  ]);
  await page.waitForTimeout(600);
  await page.click('.rail-step:has-text("KDP-Paket")');
  await page.waitForSelector('.tags', { timeout: 10000 });
  await page.waitForTimeout(400);
}
