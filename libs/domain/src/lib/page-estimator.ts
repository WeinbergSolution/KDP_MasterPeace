// Page-count estimation, migrated from the legacy statistics heuristic
// (L663–670). This is an ESTIMATE only (finding N07); the final page count
// comes from the real PDF render (WP-C6) and must override it for cover math.

/** Words per printed page assumed by the legacy heuristic. */
export const WORDS_PER_PAGE = 235;

/** Extra pages reserved per chapter (headings, breaks) — legacy `1.5×chapters`. */
export const PAGES_PER_CHAPTER = 1.5;

/** Fixed front/back-matter page allowance when a book has any content. */
export const FRONT_BACK_MATTER_PAGES = 5;

/**
 * Estimates the printed interior page count from word and chapter counts.
 *
 * Mirrors the legacy formula `ceil(words/235) + round(chapters×1.5) + 5`
 * (only adding the fixed allowance when the book has content). The result is a
 * calibration-pending estimate, never a final page count.
 *
 * @param totalWords Total manuscript word count (chapters plus extras).
 * @param chapterCount Number of chapters in the book.
 * @returns The estimated interior page count (>= 0).
 * @throws If either argument is negative.
 */
export function estimatePageCount(
  totalWords: number,
  chapterCount: number,
): number {
  if (totalWords < 0 || chapterCount < 0)
    throw new Error('inputs must be >= 0');
  const contentPages = Math.ceil(totalWords / WORDS_PER_PAGE);
  const chapterPages = Math.round(chapterCount * PAGES_PER_CHAPTER);
  const matterPages = totalWords > 0 ? FRONT_BACK_MATTER_PAGES : 0;
  return Math.max(0, contentPages + chapterPages + matterPages);
}
