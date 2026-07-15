import { describe, expect, it } from 'vitest';
import type { DocumentNode } from '@kdp/contracts';
import { parseMarkup } from './parse-markup.js';
import { validateDocument } from '../validation/validate-document.js';

/**
 * Finds the first node of a given type in a depth-first traversal.
 *
 * @param node The current node.
 * @param type The node type to find.
 * @returns The first matching node, or undefined.
 */
function find(node: DocumentNode, type: string): DocumentNode | undefined {
  if (node.type === type) return node;
  for (const child of node.children ?? []) {
    const hit = find(child, type);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Collects the plain text of a node subtree.
 *
 * @param node The node to read.
 * @returns The concatenated text of the subtree.
 */
function textOf(node: DocumentNode): string {
  const own = node.text ?? '';
  return own + (node.children ?? []).map(textOf).join('');
}

describe('parseMarkup', () => {
  it('parses heading levels and produces a valid document', () => {
    const result = parseMarkup('## Two\n### Three');
    expect(validateDocument(result.document).errors).toEqual([]);
    expect(find(result.document!.root, 'heading')?.attrs?.['level']).toBe(2);
  });

  it('degrades `# ` to level 2 with MW-H1-DEGRADE', () => {
    const result = parseMarkup('# Legacy title');
    expect(find(result.document!.root, 'heading')?.attrs?.['level']).toBe(2);
    expect(result.warnings.map((w) => w.code)).toContain('MW-H1-DEGRADE');
  });

  it('splits **bold** into strong text runs', () => {
    const para = find(parseMarkup('a **b** c').document!.root, 'paragraph')!;
    const strong = (para.children ?? []).find((c) =>
      c.marks?.includes('strong'),
    );
    expect(strong?.text).toBe('b');
  });

  it('keeps unbalanced ** literal and warns MW-BOLD-UNBALANCED', () => {
    const result = parseMarkup('text with **unbalanced');
    expect(textOf(result.document!.root)).toContain('**unbalanced');
    expect(result.warnings.map((w) => w.code)).toContain('MW-BOLD-UNBALANCED');
  });

  it('groups consecutive bullets into one unordered list', () => {
    const list = find(
      parseMarkup('- a\n* b\n- c').document!.root,
      'unorderedList',
    )!;
    expect(list.children).toHaveLength(3);
  });

  it('normalizes ordered numbering and warns MW-OL-INDEX on gaps', () => {
    const result = parseMarkup('1. a\n5. b');
    expect(find(result.document!.root, 'orderedList')?.children).toHaveLength(
      2,
    );
    expect(result.warnings.map((w) => w.code)).toContain('MW-OL-INDEX');
  });

  it('parses checklist items with checked state', () => {
    const checklist = find(
      parseMarkup('- [ ] open\n- [x] done').document!.root,
      'checklist',
    )!;
    expect(checklist.children?.[1]?.attrs?.['checked']).toBe(true);
  });

  it('clamps [linien:n] to 15 and warns MW-LINES-CLAMP', () => {
    const result = parseMarkup('[linien:20]');
    expect(find(result.document!.root, 'writingLines')?.attrs?.['count']).toBe(
      15,
    );
    expect(result.warnings.map((w) => w.code)).toContain('MW-LINES-CLAMP');
  });

  it('parses a [skala] question into a 1-10 scale', () => {
    const scale = find(
      parseMarkup('[skala] How strong?').document!.root,
      'scale',
    )!;
    expect(scale.attrs).toMatchObject({
      min: 1,
      max: 10,
      question: 'How strong?',
    });
  });

  it('parses a titled exercise box with children', () => {
    const box = find(
      parseMarkup(':::uebung Title\ninside\n:::').document!.root,
      'exerciseBox',
    )!;
    expect(box.attrs?.['title']).toBe('Title');
    expect(textOf(box)).toContain('inside');
  });

  it('warns MW-BOX-UNCLOSED for an unterminated box', () => {
    const result = parseMarkup(':::tipp\nno end');
    expect(result.warnings.map((w) => w.code)).toContain('MW-BOX-UNCLOSED');
  });

  it('preserves an unknown fence as a paragraph with MW-BOX-UNKNOWN', () => {
    const result = parseMarkup(':::unknown thing');
    expect(textOf(result.document!.root)).toContain(':::unknown thing');
    expect(result.warnings.map((w) => w.code)).toContain('MW-BOX-UNKNOWN');
  });

  it('handles CRLF line endings identically to LF', () => {
    expect(parseMarkup('## A\r\n- b').document).toEqual(
      parseMarkup('## A\n- b').document,
    );
  });

  it('produces a valid empty document for empty input', () => {
    const result = parseMarkup('');
    expect(validateDocument(result.document).errors).toEqual([]);
    expect(result.document!.root.id).toBe('root');
  });

  it('emits deterministic path ids and a source map', () => {
    const result = parseMarkup('## A\nbody');
    expect(result.document!.root.id).toBe('root');
    expect(result.sourceMap.length).toBeGreaterThan(0);
    expect(result.sourceMap[0].position.line).toBeGreaterThan(0);
  });
});
