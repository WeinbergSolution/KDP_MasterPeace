// KDP print-format domain knowledge, migrated from the legacy prototype
// (TRIMS/GUTTERS/PAPERS, spine formula, bleed/safe). These values are treated
// as test vectors pending validation against official KDP specs.
// TODO(WP-C6): validate every vector against Amazon KDP's published tables.

/** Supported KDP trim sizes (interior page dimensions). */
export type TrimKey = '5x8' | '5.5x8.5' | '6x9' | '7x10' | '8.5x11';

/** Supported KDP paper stocks. */
export type PaperKey = 'cream' | 'white';

/** KDP gutter (inside margin) tiers, keyed by page-count range. */
export type GutterKey = '24-150' | '151-300' | '301-500';

/** Physical page dimensions in millimetres. */
export interface TrimSize {
  readonly widthMm: number;
  readonly heightMm: number;
}

/** Computed full-cover dimensions for a paperback (back + spine + front). */
export interface CoverDimensions {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly spineWidthMm: number;
  readonly pageCount: number;
  readonly hasSpineText: boolean;
}

const MM_PER_INCH = 25.4;

/** Trim sizes in millimetres (legacy L13–19). */
export const TRIMS: Record<TrimKey, TrimSize> = {
  '5x8': { widthMm: 127, heightMm: 203.2 },
  '5.5x8.5': { widthMm: 139.7, heightMm: 215.9 },
  '6x9': { widthMm: 152.4, heightMm: 228.6 },
  '7x10': { widthMm: 177.8, heightMm: 254 },
  '8.5x11': { widthMm: 215.9, heightMm: 279.4 },
};

/** Paper thickness in inches per page (legacy L35–38). */
export const PAPER_THICKNESS_INCH_PER_PAGE: Record<PaperKey, number> = {
  cream: 0.0025,
  white: 0.002252,
};

/** Gutter width in millimetres per page-count tier (legacy L21–25). */
export const GUTTER_MM: Record<GutterKey, number> = {
  '24-150': 9.6,
  '151-300': 12.7,
  '301-500': 15.9,
};

/** Bleed margin in millimetres (0.125 inch, legacy L471). */
export const BLEED_MM = 3.175;

/** Safe margin in millimetres (0.25 inch, legacy L472). */
export const SAFE_MM = 6.35;

/** KDP barcode reserved zone in millimetres (legacy L506). */
export const BARCODE_SIZE_MM = { widthMm: 50.8, heightMm: 30.5 } as const;

/** Minimum page count at which spine text is allowed (legacy L477). */
export const SPINE_TEXT_MIN_PAGES = 100;

/**
 * Rounds a value to two decimal places, matching the legacy `toFixed(2)`
 * behaviour so migrated measurements stay byte-comparable.
 *
 * @param value The value to round.
 * @returns The value rounded to two decimals.
 */
function round2(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Computes the spine width of a paperback from its page count and paper stock.
 *
 * @param pageCount Final interior page count (must be non-negative).
 * @param paper The KDP paper stock.
 * @returns The spine width in millimetres, rounded to two decimals.
 * @throws If the page count is negative.
 */
export function spineWidthMm(pageCount: number, paper: PaperKey): number {
  if (pageCount < 0) throw new Error('pageCount must be >= 0');
  const perPage = PAPER_THICKNESS_INCH_PER_PAGE[paper];
  return round2(pageCount * perPage * MM_PER_INCH);
}

/**
 * Computes full-cover dimensions (back + spine + front, incl. bleed) for a
 * paperback, replicating the legacy cover geometry (L468–474).
 *
 * @param trim The interior trim size key.
 * @param paper The KDP paper stock.
 * @param pageCount Final interior page count.
 * @returns The computed cover dimensions and spine metadata.
 */
export function coverDimensions(
  trim: TrimKey,
  paper: PaperKey,
  pageCount: number,
): CoverDimensions {
  const size = TRIMS[trim];
  const spine = spineWidthMm(pageCount, paper);
  const widthMm = round2(size.widthMm * 2 + spine + BLEED_MM * 2);
  const heightMm = round2(size.heightMm + BLEED_MM * 2);
  return {
    widthMm,
    heightMm,
    spineWidthMm: spine,
    pageCount,
    hasSpineText: pageCount >= SPINE_TEXT_MIN_PAGES,
  };
}
