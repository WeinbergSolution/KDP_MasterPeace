// Static tables for Step 4 (Formatierung), mirrored 1:1 from the Legacy V3
// reference: page-count gutters, font labels, trim options and the SAMPLE markup
// used in the live preview when the first chapter has no content yet.

import { TRIM_LABELS } from './writing-utils';

/** A gutter (inner-margin) option keyed by page-count band. */
export interface GutterOption {
  readonly key: string;
  readonly label: string;
  readonly mm: number;
}

export const GUTTERS: readonly GutterOption[] = [
  { key: '24-150', label: '24–150 Seiten (Minimum 9,6 mm)', mm: 13.5 },
  { key: '151-300', label: '151–300 Seiten (Minimum 12,7 mm)', mm: 16.5 },
  { key: '301-500', label: '301–500 Seiten (Minimum 15,9 mm)', mm: 19.5 },
];

/** Font choices (id + display label) for the book text. */
export const FONT_OPTIONS: readonly { key: string; label: string }[] = [
  { key: 'garamond', label: 'EB Garamond (klassisch)' },
  { key: 'lora', label: 'Lora (modern-warm)' },
  { key: 'crimson', label: 'Crimson Pro (elegant)' },
  { key: 'source', label: 'Source Serif (sachlich)' },
];

/** Trim-size choices (id + display label), derived from the shared table. */
export const TRIM_OPTIONS: readonly { key: string; label: string }[] = [
  '5x8',
  '5.5x8.5',
  '6x9',
  '7x10',
  '8.5x11',
].map((key) => ({ key, label: TRIM_LABELS[key] }));

/** Text-alignment choices (Blocksatz / Linksbündig). */
export const ALIGN_OPTIONS: readonly { key: string; label: string }[] = [
  { key: 'justify', label: 'Blocksatz mit Silbentrennung (Buch-Standard)' },
  { key: 'left', label: 'Linksbündig / Flattersatz (keine Wortlücken)' },
];

/** Preview fallback content shown when the first chapter is still empty. */
export const SAMPLE_MARKUP = [
  'Vielleicht kennst du dieses Gefühl: Du gibst alles in deinen Beziehungen – und fragst dich trotzdem, ob du genug bist. **Dein Selbstwert** ist kein festes Merkmal, sondern eine Fähigkeit, die du trainieren kannst.',
  '> Du musst dich nicht beweisen, um wertvoll zu sein.',
  ':::uebung Deine innere Stimme kennenlernen',
  'Notiere drei Sätze, die dein innerer Kritiker dir häufig sagt:',
  '[linien:3]',
  '- [ ] Ich habe die Sätze aufgeschrieben',
  '- [ ] Ich habe sie laut ausgesprochen',
  ':::',
  '[skala] Wie stark bestimmt deine innere Kritik gerade deinen Alltag?',
  ':::tipp',
  'Beobachte deine Gedanken diese Woche wie ein neugieriger Forscher – ohne zu bewerten.',
  ':::',
].join('\n');
