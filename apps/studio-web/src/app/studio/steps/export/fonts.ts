// Google-Fonts helper for the exported book artifacts. These are standalone
// documents the author opens/prints locally (not the studio runtime), so — to
// keep the chosen typeface in the final PDF (Step-4 „Schriftart") — the export
// files load the font like the Legacy V3 reference. The studio app itself uses
// no external fonts.

/** Google-Fonts family query string per settings font id. */
export const FONT_GF: Record<string, string> = {
  garamond: 'EB+Garamond:ital,wght@0,400;0,600;1,400',
  lora: 'Lora:ital,wght@0,400;0,600;1,400',
  crimson: 'Crimson+Pro:ital,wght@0,400;0,600;1,400',
  source: 'Source+Serif+4:ital,wght@0,400;0,600;1,400',
};

/**
 * Builds the @import rule loading the book font + Fraunces (headings).
 *
 * @param fontKey The settings font id.
 * @returns The CSS @import rule.
 */
export function fontImport(fontKey: string): string {
  const gf = FONT_GF[fontKey] ?? FONT_GF['garamond'];
  return `@import url('https://fonts.googleapis.com/css2?family=${gf}&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap');`;
}
