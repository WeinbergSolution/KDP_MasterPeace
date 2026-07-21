// Pure, tested export-quality domain (ported 1:1 from Legacy V3): the quality
// matrix (word count + workbook element detection), readability metrics (avg
// sentence length, long sentences, filler words) and the typography cleanup
// (spacing, punctuation, quotes, dashes) that preserves the WP-C1 markup.

import type { BookProject } from '../../../core/models/book-project';
import { countWords } from '../../project-stats';
import { extrasFor } from '../writing-utils';

const NBSP = new RegExp(String.fromCharCode(0xa0), 'g');

/** Filler words counted by the readability check. */
export const FILLERS: readonly string[] = [
  'eigentlich',
  'quasi',
  'halt',
  'irgendwie',
  'sozusagen',
  'gewissermaßen',
  'letztendlich',
  'im grunde',
  'ziemlich',
  'durchaus',
  'gleichsam',
  'praktisch gesehen',
];

/** One quality-matrix row. */
export interface AuditRow {
  i: number;
  title: string;
  words: number;
  uebung: boolean;
  linien: boolean;
  check: boolean;
}

/** One readability row. */
export interface ReadabilityRow {
  i: number;
  title: string;
  avg: number;
  long: number;
  fill: number;
}

/**
 * Builds the quality-matrix rows for a project.
 *
 * @param project The book project.
 * @returns One row per chapter.
 */
export function auditRows(project: BookProject): AuditRow[] {
  const isWb = project.bookType === 'workbook';
  return project.outline.map((ch, i) => {
    const c = ch.content || '';
    return {
      i,
      title: ch.title,
      words: countWords(c),
      uebung: !isWb || /:::\s*(uebung|übung)/i.test(c),
      linien: !isWb || /\[linien:/i.test(c),
      check: !isWb || /- \[ \]/.test(c) || /\[skala\]/i.test(c),
    };
  });
}

/**
 * Returns the labels of scaffold parts that are still empty.
 *
 * @param project The book project.
 * @returns The missing scaffold labels.
 */
export function missingExtras(project: BookProject): string[] {
  return extrasFor(project.bookType)
    .filter((d) => !(project.extras[d.key] || '').trim())
    .map((d) => d.label);
}

/**
 * Computes readability metrics for one chapter's text.
 *
 * @param text The chapter text.
 * @returns Average sentence length, long-sentence count and filler-word count.
 */
/** Splits plain text into per-sentence word counts (sentences > 2 words). */
function sentenceLengths(plain: string): number[] {
  return plain
    .split(/[.!?…]+\s/)
    .map((s) => countWords(s.trim()))
    .filter((n) => n > 2);
}

/**
 * Computes readability metrics for one chapter's text.
 *
 * @param text The chapter text.
 * @returns Average sentence length, long-sentence count and filler-word count.
 */
export function readabilityOf(text: string): {
  avg: number;
  long: number;
  fill: number;
} {
  const plain = String(text || '')
    .replace(/[#>*_[\]:]/g, ' ')
    .replace(/-\s\[\s\]/g, ' ');
  const lens = sentenceLengths(plain);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const long = lens.filter((l) => l > 25).length;
  const lower = ' ' + plain.toLowerCase().replace(/[.,!?;:]/g, ' ') + ' ';
  const fill = FILLERS.reduce(
    (n, f) => n + (lower.split(' ' + f + ' ').length - 1),
    0,
  );
  return { avg: Math.round(avg * 10) / 10, long, fill };
}

/**
 * Builds the readability rows for a project.
 *
 * @param project The book project.
 * @returns One readability row per chapter.
 */
export function readabilityRows(project: BookProject): ReadabilityRow[] {
  return project.outline.map((ch, i) => ({
    i,
    title: ch.title,
    ...readabilityOf(ch.content),
  }));
}

/**
 * Normalizes spacing (non-breaking, trailing, repeated, excess blank lines).
 *
 * @param s The input text.
 * @returns The spacing-normalized text.
 */
function cleanSpacing(s: string): string {
  return s
    .replace(NBSP, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Normalizes punctuation spacing, ellipses and dashes.
 *
 * @param s The input text.
 * @returns The punctuation-normalized text.
 */
function cleanPunctuation(s: string): string {
  return s
    .replace(/ ([.,!?;:])/g, '$1')
    .replace(/,([A-Za-zÄÖÜäöüß])/g, ', $1')
    .replace(/([a-zäöüß])\.([A-ZÄÖÜ])/g, '$1. $2')
    .replace(/([!?])([A-Za-zÄÖÜäöüß])/g, '$1 $2')
    .replace(/\.\.\./g, '…')
    .replace(/ - /g, ' – ');
}

/**
 * Normalizes quotation marks (language-aware) and apostrophes.
 *
 * @param s The input text.
 * @param lang The book language.
 * @returns The quote-normalized text.
 */
function cleanQuotes(s: string, lang: string): string {
  const withQuotes =
    lang === 'de'
      ? s.replace(/(^|[\s([])"/g, '$1„').replace(/"/g, '“')
      : s.replace(/(^|[\s([])"/g, '$1“').replace(/"/g, '”');
  return withQuotes.replace(/([A-Za-zÄÖÜäöüß])'([A-Za-zÄÖÜäöüß])/g, '$1’$2');
}

/**
 * Cleans typography while preserving the WP-C1 markup markers.
 *
 * @param text The input text.
 * @param lang The book language.
 * @returns The cleaned text.
 */
export function cleanText(text: string, lang: string): string {
  return cleanQuotes(
    cleanPunctuation(cleanSpacing(String(text || ''))),
    lang,
  ).trim();
}
