// Local quote extraction for the social-media quote cards (ported 1:1 from
// Legacy V3): pulls meaningful "> " lines from the chapters, de-duplicates and
// caps the count. No AI — quotes come from the manuscript itself.

import type { BookProject } from '../../../core/models/book-project';
import { parseBlocks, tidy } from '../export/block-parse';

const MIN_LEN = 15;
const MAX_LEN = 180;
const MAX_QUOTES = 12;

/**
 * Collects shareable quotes from the project's chapters (from `>` lines).
 *
 * @param project The book project.
 * @returns The de-duplicated quotes (max 12).
 */
export function collectQuotes(project: BookProject): string[] {
  const out: string[] = [];
  project.outline.forEach((ch) => {
    parseBlocks(ch.content).forEach((b) => {
      if (
        b.t === 'quote' &&
        b.x &&
        b.x.length > MIN_LEN &&
        b.x.length < MAX_LEN
      ) {
        out.push(tidy(b.x).replace(/\*\*/g, ''));
      }
    });
  });
  return [...new Set(out)].slice(0, MAX_QUOTES);
}
