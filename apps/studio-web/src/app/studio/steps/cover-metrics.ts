// KDP cover geometry, ported 1:1 from the Legacy V3 reference (spineWidthMm +
// the cover-dimension maths) as a pure, tested domain module. All values are in
// millimetres; page-count falls back to the book's page estimate.

/** KDP paper stocks: label + inch-per-page thickness. */
export const PAPERS: Record<string, { label: string; perPage: number }> = {
  cream: {
    label: 'Cremefarbenes Papier (Standard für Bücher)',
    perPage: 0.0025,
  },
  white: { label: 'Weißes Papier', perPage: 0.002252 },
};

/** Bleed per outer edge in mm (0.125"). */
export const BLEED_MM = 3.175;
/** Safety margin in mm (0.25"). */
export const SAFE_MM = 6.35;
/** Minimum page count for a spine wide enough to carry spine text. */
export const SPINE_TEXT_MIN_PAGES = 100;

/** The resolved page count and spine width for a cover. */
export interface SpineResult {
  readonly pages: number;
  readonly mm: number;
}

/**
 * Computes the spine width in mm from the page count and paper stock.
 *
 * @param pageCount The entered final page count (0/undefined uses the fallback).
 * @param paper The paper stock key ('cream' | 'white').
 * @param fallbackPages The estimated page count used when none is entered.
 * @returns The resolved page count and rounded spine width in mm.
 */
export function spineWidthMm(
  pageCount: number,
  paper: string,
  fallbackPages: number,
): SpineResult {
  const pages = pageCount || fallbackPages || 120;
  const per = (PAPERS[paper] ?? PAPERS['cream']).perPage;
  return { pages, mm: round2(pages * per * 25.4) };
}

/**
 * Computes the full cover size (with bleed) in mm.
 *
 * @param trimWidthMm The trim width in mm.
 * @param trimHeightMm The trim height in mm.
 * @param spineMm The spine width in mm.
 * @returns The overall cover width and height in mm.
 */
export function coverDimensions(
  trimWidthMm: number,
  trimHeightMm: number,
  spineMm: number,
): { widthMm: number; heightMm: number } {
  const widthMm = round2(trimWidthMm * 2 + spineMm + BLEED_MM * 2);
  const heightMm = round2(trimHeightMm + BLEED_MM * 2);
  return { widthMm, heightMm };
}

/**
 * Reports whether the spine is wide enough for spine text (≥ 100 pages).
 *
 * @param pages The resolved page count.
 * @returns True when spine text is possible.
 */
export function spineTextPossible(pages: number): boolean {
  return pages >= SPINE_TEXT_MIN_PAGES;
}

/**
 * Rounds a value to two decimal places.
 *
 * @param value The value to round.
 * @returns The rounded value.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
