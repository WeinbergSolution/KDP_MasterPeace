// Static tables + helpers for Step 3 (Schreiben), mirrored 1:1 from the Legacy
// V3 reference: book-scaffold definitions (EXTRA_DEFS/extrasFor), autopilot word
// targets, trim labels + dimensions, preview font families and chapter words.

import type { BookType, Extras } from '../../core/models/book-project';

/** A book-scaffold (front/back matter) definition. */
export interface ExtraDef {
  readonly key: keyof Extras;
  readonly label: string;
  readonly hint: string;
}

export const EXTRA_DEFS: readonly ExtraDef[] = [
  {
    key: 'einleitung',
    label: 'Einleitung',
    hint: 'Emotionaler Einstieg, der das Problem deiner Leserin spiegelt und dein Versprechen gibt.',
  },
  {
    key: 'arbeitsweise',
    label: 'Wie du mit diesem Buch arbeitest',
    hint: 'Kurze Anleitung: Rhythmus, Material, Umgang mit schweren Gefühlen.',
  },
  {
    key: 'schlusswort',
    label: 'Schlusswort',
    hint: 'Zusammenfassung, Ermutigung — und die wichtige Bitte um eine Amazon-Rezension.',
  },
  {
    key: 'autorin',
    label: 'Über die Autorin / den Autor',
    hint: 'Kurzbio in der dritten Person. Stichworte zu dir kannst du unten eintragen.',
  },
  {
    key: 'bonus',
    label: 'Bonus-Seite',
    hint: 'Verweis auf ein Freebie / deine E-Mail-Liste — mit Platzhalter [DEIN-LINK].',
  },
];

/**
 * Returns the scaffold parts that apply to a book type (Legacy parity).
 *
 * @param bookType The project's book type.
 * @returns The applicable scaffold definitions.
 */
export function extrasFor(bookType: BookType): readonly ExtraDef[] {
  if (bookType === 'roman') {
    return EXTRA_DEFS.filter((d) =>
      ['einleitung', 'schlusswort', 'autorin'].includes(d.key),
    );
  }
  return EXTRA_DEFS;
}

/** Autopilot target-length options (words per chapter). */
export const WORD_TARGETS: readonly { value: number; label: string }[] = [
  { value: 700, label: 'Kompakt (~700 Wörter)' },
  { value: 1200, label: 'Standard (~1.200 Wörter)' },
  { value: 1800, label: 'Ausführlich (~1.800 Wörter)' },
  { value: 2400, label: 'Sehr ausführlich (~2.400 Wörter)' },
];

/** Trim-size display labels (as shown in the preview label). */
export const TRIM_LABELS: Record<string, string> = {
  '5x8': '5" × 8" (12,7 × 20,3 cm)',
  '5.5x8.5': '5,5" × 8,5" (14 × 21,6 cm)',
  '6x9': '6" × 9" (15,2 × 22,9 cm)',
  '7x10': '7" × 10" (17,8 × 25,4 cm) — ideal für Workbooks',
  '8.5x11': '8,5" × 11" (21,6 × 27,9 cm) — großes Workbook',
};

/** Trim dimensions in mm (for the preview aspect ratio). */
export const TRIM_DIMS: Record<string, { w: number; h: number }> = {
  '5x8': { w: 127, h: 203.2 },
  '5.5x8.5': { w: 139.7, h: 215.9 },
  '6x9': { w: 152.4, h: 228.6 },
  '7x10': { w: 177.8, h: 254 },
  '8.5x11': { w: 215.9, h: 279.4 },
};

/** Preview font families keyed by the settings font id. */
export const FONT_FAMILIES: Record<string, string> = {
  garamond: "'EB Garamond', Georgia, serif",
  lora: "'Lora', Georgia, serif",
  crimson: "'Crimson Pro', Georgia, serif",
  source: "'Source Serif 4', Georgia, serif",
};

/** The word for "chapter" per book language (preview label). */
export const CHAPTER_WORD: Record<string, string> = {
  de: 'Kapitel',
  en: 'Chapter',
  es: 'Capítulo',
  fr: 'Chapitre',
  it: 'Capitolo',
};
