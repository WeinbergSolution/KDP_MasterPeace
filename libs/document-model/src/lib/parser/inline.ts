import { raw, type RawNode } from '../ast/raw-node.js';

// Inline parsing (legacy-backup-schema.md §4): `**bold**` becomes strong text
// runs. Unbalanced `**` stays literal (MW-BOLD-UNBALANCED). Whitespace is tidied
// like the legacy renderer (non-breaking spaces + runs of spaces collapse).

const NBSP = String.fromCharCode(160);

/**
 * Normalizes whitespace the way the legacy renderer did.
 *
 * @param text The raw inline text.
 * @returns The text with NBSP and repeated spaces collapsed to single spaces.
 */
function tidy(text: string): string {
  return text
    .split(NBSP)
    .join(' ')
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Splits inline text into plain and strong runs on balanced `**` pairs.
 *
 * @param text The tidied inline text.
 * @returns Inline `text` runs (empty segments omitted).
 */
function splitBold(text: string): RawNode[] {
  const runs: RawNode[] = [];
  text.split(/\*\*(.+?)\*\*/g).forEach((part, index) => {
    if (part === '') return;
    runs.push(
      index % 2 === 1
        ? raw('text', { text: part, marks: ['strong'] })
        : raw('text', { text: part }),
    );
  });
  return runs;
}

/**
 * Parses inline markup into text runs and reports unbalanced bold markers.
 *
 * @param text The raw inline text of a block.
 * @returns The inline runs and whether an unbalanced `**` was present.
 */
export function parseInline(text: string): {
  runs: RawNode[];
  unbalanced: boolean;
} {
  const normalized = tidy(text);
  const unbalanced = (normalized.match(/\*\*/g)?.length ?? 0) % 2 !== 0;
  const runs = splitBold(normalized);
  return {
    runs: runs.length > 0 ? runs : [raw('text', { text: '' })],
    unbalanced,
  };
}
