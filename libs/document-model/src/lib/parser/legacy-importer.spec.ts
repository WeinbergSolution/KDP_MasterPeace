import { describe, expect, it } from 'vitest';
import type { DocumentNode } from '@kdp/contracts';
import { loadGoldenMaster } from '@kdp/testing';
import { importLegacyBackup } from './legacy-importer.js';
import { validateDocument } from '../validation/validate-document.js';

/**
 * Collects every node type and every text fragment of a document tree.
 *
 * @param node The current node.
 * @param types Accumulating set of node types.
 * @param texts Accumulating list of text fragments.
 */
function collect(
  node: DocumentNode,
  types: Set<string>,
  texts: string[],
): void {
  types.add(node.type);
  if (node.text) texts.push(node.text);
  (node.children ?? []).forEach((child) => collect(child, types, texts));
}

/**
 * Summarizes a document into its node-type set and concatenated text.
 *
 * @param root The document root node.
 * @returns The set of node types and the joined text content.
 */
function summarize(root: DocumentNode): { types: Set<string>; text: string } {
  const types = new Set<string>();
  const texts: string[] = [];
  collect(root, types, texts);
  return { types, text: texts.join(' ') };
}

describe('importLegacyBackup (golden master)', () => {
  it('imports the v2 backup into a valid Book AST', () => {
    const result = importLegacyBackup(loadGoldenMaster('v2'));
    expect(result.document).not.toBeNull();
    expect(validateDocument(result.document).errors).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('produces identical documents from the v1 and v2 backups', () => {
    const v1 = importLegacyBackup(loadGoldenMaster('v1'));
    const v2 = importLegacyBackup(loadGoldenMaster('v2'));
    expect(v1.document).toEqual(v2.document);
  });

  it('is deterministic (repeated import yields identical output)', () => {
    const a = importLegacyBackup(loadGoldenMaster('v2'));
    const b = importLegacyBackup(loadGoldenMaster('v2'));
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('renders every documented markup construct as a node type', () => {
    const result = importLegacyBackup(loadGoldenMaster('v2'));
    const { types } = summarize(result.document!.root);
    for (const type of [
      'book',
      'frontMatter',
      'chapter',
      'backMatter',
      'authorProfile',
      'heading',
      'paragraph',
      'quote',
      'unorderedList',
      'listItem',
      'orderedList',
      'checklist',
      'checkItem',
      'writingLines',
      'scale',
      'exerciseBox',
      'tipBox',
      'exampleBox',
      'text',
    ]) {
      expect(types, `missing node type: ${type}`).toContain(type);
    }
  });

  it('emits every documented MW-* warning exercised by the fixture', () => {
    const result = importLegacyBackup(loadGoldenMaster('v2'));
    const codes = new Set(result.warnings.map((w) => w.code));
    for (const code of [
      'MW-H1-DEGRADE',
      'MW-LINES-CLAMP',
      'MW-OL-INDEX',
      'MW-BOX-UNKNOWN',
      'MW-BOX-UNCLOSED',
      'MW-BOLD-UNBALANCED',
    ]) {
      expect(codes, `missing warning: ${code}`).toContain(code);
    }
  });

  it('clamps writing lines to 15 and records the requested value', () => {
    const result = importLegacyBackup(loadGoldenMaster('v2'));
    const clamp = result.warnings.find((w) => w.code === 'MW-LINES-CLAMP');
    expect(clamp?.context?.['requested']).toBe(20);
    expect(clamp?.context?.['count']).toBe(15);
  });

  it('loses no key content (unknown box line and chapter text survive)', () => {
    const result = importLegacyBackup(loadGoldenMaster('v2'));
    const { text } = summarize(result.document!.root);
    expect(text).toContain('Dieser Boxtyp existiert nicht'); // MW-BOX-UNKNOWN line preserved as paragraph
    expect(text).toContain('unbekannten Boxtyp'); // following paragraph preserved
    expect(text).toContain('Verstehen'); // chapter content
    expect(text).toContain('DEIN-LINK'); // bonus back-matter
  });

  it('assigns unique, path-based, stable ids', () => {
    const result = importLegacyBackup(loadGoldenMaster('v2'));
    const ids: string[] = [];
    collect(result.document!.root, new Set(), []);
    const gather = (n: DocumentNode) => {
      ids.push(n.id);
      (n.children ?? []).forEach(gather);
    };
    gather(result.document!.root);
    expect(result.document!.root.id).toBe('root');
    expect(new Set(ids).size).toBe(ids.length);
  });
});
