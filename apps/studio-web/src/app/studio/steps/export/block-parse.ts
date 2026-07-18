// Legacy V3 export block model + parser, ported 1:1. The export builders
// (print, e-book, EPUB, digital, audio, printable) all run on this block list.
// This is the reference's own lightweight parser (separate from the WP-C1 AST
// used for the live preview) so the generated files match the reference exactly.

/** A parsed content block (heading, paragraph, list item, box, …). */
export interface Block {
  t: string;
  x?: string;
  n?: number;
  kind?: string;
  title?: string;
  children?: Block[];
}

/** The non-breaking space (U+00A0), matched without an irregular-whitespace literal. */
const NBSP = new RegExp(String.fromCharCode(0xa0), 'g');

/** Collapses non-breaking and repeated spaces (typography tidy). */
export function tidy(value: string): string {
  return String(value || '')
    .replace(NBSP, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

/** Escapes HTML-significant characters after tidying. */
export function esc(value: string): string {
  return tidy(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escapes text and renders **bold** as <strong> (for export HTML). */
export function fmtHtml(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Classifies a bracket block ([linien:n] / [skala]).
 *
 * @param l The trimmed line.
 * @returns The block, or null when the line is not a bracket block.
 */
function bracketBlock(l: string): Block | null {
  if (/^\[linien:\s*\d+\]/i.test(l)) {
    return {
      t: 'lines',
      n: Math.min(15, parseInt(l.match(/\d+/)?.[0] ?? '3', 10) || 3),
    };
  }
  if (/^\[skala\]/i.test(l))
    return { t: 'skala', x: l.replace(/^\[skala\]\s*/i, '') };
  return null;
}

/**
 * Classifies one non-empty, non-fence content line into a block.
 *
 * @param l The trimmed line.
 * @returns The block for the line.
 */
function classifyLine(l: string): Block {
  if (l.startsWith('### ')) return { t: 'h3', x: l.slice(4) };
  if (l.startsWith('## ')) return { t: 'h2', x: l.slice(3) };
  if (l.startsWith('# ')) return { t: 'h2', x: l.slice(2) };
  const bracket = bracketBlock(l);
  if (bracket) return bracket;
  if (l.startsWith('- [ ]') || l.startsWith('- [x]'))
    return { t: 'check', x: l.slice(5).trim() };
  if (l.startsWith('> ')) return { t: 'quote', x: l.slice(2) };
  if (l.startsWith('- ') || l.startsWith('* '))
    return { t: 'li', x: l.slice(2) };
  if (/^\d+\.\s/.test(l)) return { t: 'oli', x: l.replace(/^\d+\.\s/, '') };
  return { t: 'p', x: l };
}

/**
 * Handles a "::: " fence line, opening/closing an exercise/tip/example box.
 *
 * @param l The trimmed fence line.
 * @param blocks The top-level block list (boxes are pushed here on close).
 * @param box The currently open box, or null.
 * @returns The new open box, or null.
 */
function handleFence(
  l: string,
  blocks: Block[],
  box: Block | null,
): Block | null {
  if (box && (l === ':::' || l === '::: ')) {
    blocks.push(box);
    return null;
  }
  const m = l.match(/^:::(uebung|übung|tipp|beispiel)\s*(.*)$/i);
  if (m) {
    if (box) blocks.push(box);
    return {
      t: 'box',
      kind: m[1].toLowerCase().replace('ü', 'ue'),
      title: m[2] || '',
      children: [],
    };
  }
  if (box) blocks.push(box);
  return null;
}

/**
 * Parses markup into the legacy export block list.
 *
 * @param text The chapter/section markup.
 * @returns The parsed blocks (with question+lines groups joined).
 */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let box: Block | null = null;
  for (const raw of (text || '').split('\n')) {
    const l = raw.trim();
    if (l.startsWith(':::')) {
      box = handleFence(l, blocks, box);
      continue;
    }
    if (!l) continue;
    (box ? (box.children ?? []) : blocks).push(classifyLine(l));
  }
  if (box) blocks.push(box);
  return groupLinesWithQuestion(blocks);
}

/**
 * Groups a question with its following writing-lines/scale blocks so they never
 * break across a page (page-break-inside: avoid).
 *
 * @param blocks The parsed blocks.
 * @returns The blocks with question groups joined.
 */
export function groupLinesWithQuestion(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === 'box') {
      out.push({ ...b, children: groupLinesWithQuestion(b.children ?? []) });
      continue;
    }
    const grp = collectGroup(blocks, i);
    if (grp.length > 1) {
      out.push({ t: 'grp', children: grp });
      i += grp.length - 1;
    } else out.push(b);
  }
  return out;
}

/**
 * Collects a question block plus its trailing lines/scale blocks.
 *
 * @param blocks The block list.
 * @param i The index of the candidate question block.
 * @returns The group (length 1 when it is not a question with follow-ups).
 */
function collectGroup(blocks: Block[], i: number): Block[] {
  const b = blocks[i];
  const isQuestion =
    b.t === 'p' || b.t === 'li' || b.t === 'oli' || b.t === 'h3';
  if (!isQuestion) return [b];
  const grp = [b];
  let j = i + 1;
  while (
    j < blocks.length &&
    (blocks[j].t === 'lines' || blocks[j].t === 'skala')
  ) {
    grp.push(blocks[j]);
    j += 1;
  }
  return grp;
}
