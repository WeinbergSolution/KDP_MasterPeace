// Pure, deterministic project statistics for the studio rail. No AI, no I/O.

import type { BookProject } from '../core/models/book-project';

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

/** Rail statistics for a full project (Legacy V3 parity). */
export interface RailStats {
  readonly words: number;
  readonly written: number;
  readonly pages: number;
}

/**
 * Sums the word count across all outline chapters and extras.
 *
 * @param project The active project.
 * @returns The total word count.
 */
function totalWords(project: BookProject): number {
  const chapters = project.outline.reduce(
    (n, c) => n + countWords(c.content),
    0,
  );
  const extras = Object.values(project.extras).reduce(
    (n, t) => n + countWords(t),
    0,
  );
  return chapters + extras;
}

/**
 * Computes the rail statistics (words, written chapters, estimated pages).
 *
 * @param project The active project.
 * @returns The rail statistics matching the Legacy V3 formula.
 */
export function computeRailStats(project: BookProject): RailStats {
  const words = totalWords(project);
  const written = project.outline.filter(
    (c) => countWords(c.content) > 150,
  ).length;
  const chapters = project.outline.length;
  const pages = Math.max(
    0,
    Math.ceil(words / 235) + Math.round(chapters * 1.5) + (words ? 5 : 0),
  );
  return { words, written, pages };
}
