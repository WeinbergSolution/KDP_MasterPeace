// Export HTML renderer for the legacy block model (ported 1:1). Emits the class
// names the export stylesheets target (.li/.dot, .chk/.box, .wlines/.wline,
// .skala/.skrow, .ebox/.elabel, .grp).

import { type Block, esc, fmtHtml } from './block-parse';

/**
 * Renders a scale (1–10) block.
 *
 * @param question The scale question.
 * @returns The scale HTML.
 */
function skalaHtml(question: string): string {
  const points = Array.from(
    { length: 10 },
    (_u, j) => `<span>${j + 1}</span>`,
  ).join('');
  return `<div class="skala"><p>${fmtHtml(question)}</p><div class="skrow">${points}</div></div>`;
}

/**
 * Renders an exercise/tip/example box.
 *
 * @param b The box block.
 * @returns The box HTML.
 */
function boxHtml(b: Block): string {
  const cls = b.kind === 'tipp' ? 'tipp' : 'uebung';
  const word =
    b.kind === 'tipp' ? 'Tipp' : b.kind === 'beispiel' ? 'Beispiel' : 'Übung';
  const label = `${word}${b.title ? ': ' + esc(b.title) : ''}`;
  return `<div class="ebox ${cls}"><div class="elabel">${label}</div>${blocksToHtml(b.children ?? [])}</div>`;
}

/** Per-type export-HTML renderers (declarative switch replacement). */
const RENDERERS: Record<string, (b: Block) => string> = {
  h2: (b) => `<h2>${fmtHtml(b.x ?? '')}</h2>`,
  h3: (b) => `<h3>${fmtHtml(b.x ?? '')}</h3>`,
  p: (b) => `<p>${fmtHtml(b.x ?? '')}</p>`,
  quote: (b) => `<blockquote>${fmtHtml(b.x ?? '')}</blockquote>`,
  li: (b) =>
    `<div class="li"><span class="dot"></span><span>${fmtHtml(b.x ?? '')}</span></div>`,
  oli: (b) => `<div class="li"><span>${fmtHtml(b.x ?? '')}</span></div>`,
  check: (b) =>
    `<div class="chk"><span class="box"></span><span>${fmtHtml(b.x ?? '')}</span></div>`,
  lines: (b) =>
    `<div class="wlines">${'<div class="wline"></div>'.repeat(b.n ?? 3)}</div>`,
  skala: (b) => skalaHtml(b.x ?? ''),
  box: (b) => boxHtml(b),
  grp: (b) => `<div class="grp">${blocksToHtml(b.children ?? [])}</div>`,
};

/**
 * Renders a list of blocks to export HTML.
 *
 * @param blocks The blocks.
 * @returns The joined HTML.
 */
export function blocksToHtml(blocks: Block[]): string {
  return blocks.map((b) => RENDERERS[b.t]?.(b) ?? '').join('\n');
}
