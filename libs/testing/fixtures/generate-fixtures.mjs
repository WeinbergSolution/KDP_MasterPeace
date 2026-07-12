// Deterministic generator for the legacy golden-master fixtures (WP-B0).
// Emits static JSON exercising every markup construct and every documented
// parser deviation (MW-*) from docs/migration/legacy-react-to-angular.md §3.
// Run: node gen-fixtures.mjs <outDir>

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const chapter1 = [
  '## Verstehen, was Selbstwert ist',
  'Vielleicht kennst du dieses Gefuehl: du gibst **alles** und fragst dich trotzdem, ob du genug bist.',
  '',
  '> Du musst dich nicht beweisen, um wertvoll zu sein.',
  '### Woher der innere Kritiker kommt',
  '- Fruehe Praegungen',
  '- Vergleich mit anderen',
  '* Alternatives Aufzaehlungszeichen',
  '[skala] Wie stark bestimmt die innere Kritik gerade deinen Alltag?',
  ':::uebung Deine innere Stimme kennenlernen',
  'Notiere drei Saetze, die dein innerer Kritiker dir haeufig sagt:',
  '[linien:3]',
  '- [ ] Ich habe die Saetze aufgeschrieben',
  '- [x] Ich habe sie laut ausgesprochen',
  ':::',
  ':::tipp',
  'Beobachte deine Gedanken diese Woche wie ein neugieriger Forscher.',
  ':::',
].join('\n');

const chapter2 = [
  '# Alte Ueberschrift auf Ebene eins',
  'Dieser Absatz enthaelt **unbalancierten Fettdruck ohne Ende.',
  '1. Erster Schritt',
  '2. Zweiter Schritt',
  '3. Dritter Schritt',
  '5. Fuenftens mit falscher Startnummer',
  '6. Sechstens',
  '[linien:20]',
  ':::beispiel Ein Alltagsbeispiel',
  'Anna bemerkt ihren Kritiker mitten im Meeting und atmet bewusst durch.',
  ':::',
  ':::tipp',
  ':::',
].join('\n');

const chapter3 = [
  '## Ausblick und Abschluss',
  'Ein letzter Gedanke zum Abschluss deiner Reise.',
  ':::unbekannt Dieser Boxtyp existiert nicht',
  'Diese Zeile beschreibt einen unbekannten Boxtyp und darf nicht verloren gehen.',
  ':::uebung Bewusst nicht geschlossene Box',
  'Diese Box wird absichtlich nie geschlossen und laeuft bis zum Kapitelende.',
  '[linien:5]',
  '- [ ] Letzter offener Punkt',
].join('\n');

const project = {
  niche: 'Selbstwert staerken nach toxischen Beziehungen',
  chapterCount: 3,
  ideas: [
    {
      titel: 'Wieder bei dir ankommen',
      untertitel: 'Ein Workbook fuer echten Selbstwert',
      zielgruppe: 'Frauen nach belastenden Beziehungen',
      versprechen: 'In acht Wochen zu einem stabilen inneren Fundament.',
    },
  ],
  title: 'Wieder bei dir ankommen',
  subtitle: 'Ein Workbook fuer echten Selbstwert',
  audience: 'Frauen nach belastenden Beziehungen',
  promise: 'In acht Wochen zu einem stabilen inneren Fundament.',
  author: 'M. Beispielautorin',
  bio: 'Coachin fuer emotionale Resilienz, keine erfundenen Titel.',
  outline: [
    { id: 1000, title: 'Verstehen, was Selbstwert ist', goal: 'Grundlagen begreifen', content: chapter1 },
    { id: 1001, title: 'Alte Muster erkennen', goal: 'Praegungen sichtbar machen', content: chapter2 },
    { id: 1002, title: 'Neue Wege gehen', goal: 'Ins Handeln kommen', content: chapter3 },
  ],
  extras: {
    einleitung: 'Willkommen. Dieses Buch begleitet dich Schritt fuer Schritt.\n\nDu bist hier genau richtig.',
    arbeitsweise: 'So arbeitest du mit diesem Buch:\n- [ ] Ein Kapitel pro Woche\n- [ ] Stift und Ruhe bereitlegen',
    schlusswort: 'Du hast einen mutigen Weg gewaehlt.\n> Bitte hinterlasse eine ehrliche Amazon-Rezension.',
    autorin: 'Die Autorin schreibt aus eigener Erfahrung, in der dritten Person und ohne erfundene Qualifikationen.',
    bonus: 'Hol dir das kostenlose Journal unter [DEIN-LINK]:\n- Reflexionsfragen\n- Affirmationskarten',
  },
  cover: {
    pageCount: 0,
    paper: 'cream',
    bg: '#2E2A3B',
    fg: '#F5F1E6',
    blurb: 'Ein warmes, fundiertes Workbook fuer deinen Selbstwert.',
    brief: 'Ruhige, wuerdevolle Bildsprache in gedecktem Violett.',
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
  kdp: {
    beschreibung: 'Ein achtwoechiges Workbook, das dich zurueck zu deinem Selbstwert begleitet.',
    keywords: ['selbstwert', 'workbook', 'beziehung', 'heilung', 'achtsamkeit', 'selbstliebe', 'psychologie'],
    kategorien: ['Ratgeber', 'Psychologie', 'Selbsthilfe'],
  },
};

const outDir = process.argv[2] || '.';
// v2 schema: full backup wrapper { project, step }; step is UI state, discarded on import.
writeFileSync(
  join(outDir, 'legacy-golden-master.json'),
  JSON.stringify({ project, step: 5 }, null, 2) + '\n',
);
// v1 schema: older direct export = the bare project object; importer accepts d.project || d.
writeFileSync(
  join(outDir, 'legacy-golden-master-v1.json'),
  JSON.stringify(project, null, 2) + '\n',
);
process.stdout.write('fixtures written to ' + outDir + '\n');
