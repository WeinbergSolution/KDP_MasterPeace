// Audiobook-script renderer for the legacy block model (ported 1:1): headings as
// spoken lines, writing lines as [PAUSE] markers, scales as spoken instructions,
// checkboxes as spoken tasks, boxes as announced exercises/tips.

import { type Block, tidy } from './block-parse';

/** Strips bold markers from inline text. */
function plain(x: string): string {
  return tidy(x).replace(/\*\*/g, '');
}

/**
 * Renders an exercise/tip box to a spoken-script fragment.
 *
 * @param b The box block.
 * @returns The spoken box fragment.
 */
function boxAudio(b: Block): string {
  const head = b.kind === 'tipp' ? 'Ein Tipp für dich' : 'Eine Übung';
  const title = b.title ? `: ${b.title}` : '';
  return `\n${head}${title}.\n` + blocksToAudio(b.children ?? []);
}

/** Per-type audiobook-script renderers. */
const RENDERERS: Record<string, (b: Block) => string> = {
  h2: (b) => `\n${plain(b.x ?? '')}.\n`,
  h3: (b) => `\n${plain(b.x ?? '')}.\n`,
  p: (b) => plain(b.x ?? ''),
  quote: (b) => `Merke dir: ${plain(b.x ?? '')}`,
  li: (b) => `– ${plain(b.x ?? '')}`,
  oli: (b) => `– ${plain(b.x ?? '')}`,
  check: (b) => `Aufgabe: ${plain(b.x ?? '')}`,
  lines: () => '[PAUSE – Zeit zum Nachdenken oder Mitschreiben]',
  skala: (b) =>
    `${plain(b.x ?? '')} Überlege dir einen Wert zwischen eins und zehn. [KURZE PAUSE]`,
  box: (b) => boxAudio(b),
};

/**
 * Renders a list of blocks to an audiobook-script string.
 *
 * @param blocks The blocks.
 * @returns The joined spoken script.
 */
export function blocksToAudio(blocks: Block[]): string {
  return blocks
    .map((b) => RENDERERS[b.t]?.(b) ?? '')
    .filter(Boolean)
    .join('\n');
}
