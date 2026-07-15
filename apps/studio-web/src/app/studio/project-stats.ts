// Pure, deterministic project statistics for the studio rail. No AI, no I/O.

export const STEP_LABELS: readonly string[] = [
  'Idee',
  'Gliederung',
  'Schreiben',
  'Formatierung',
  'Cover',
  'Export',
  'KDP-Paket',
  'Veröffentlichen',
];

const WORDS_PER_PAGE = 235;

/** Word/page statistics derived from the working markup. */
export interface ProjectStats {
  readonly words: number;
  readonly pages: number;
}

/**
 * Counts whitespace-separated words in a text.
 *
 * @param text The text to measure.
 * @returns The number of words.
 */
export function countWords(text: string): number {
  return (text ?? '').split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates printed pages from a word count.
 *
 * @param words The total word count.
 * @returns The estimated page count.
 */
export function estimatePages(words: number): number {
  return Math.max(0, Math.ceil(words / WORDS_PER_PAGE));
}

/**
 * Computes the rail statistics for a project's working markup.
 *
 * @param markup The project's working markup.
 * @returns The word and page estimate.
 */
export function computeStats(markup: string): ProjectStats {
  const words = countWords(markup);
  return { words, pages: estimatePages(words) };
}
