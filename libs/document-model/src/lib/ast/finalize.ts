import type { BookDocument, DocumentNode } from '@kdp/contracts';
import type { SourceMapEntry } from '../migration/diagnostics.js';
import type { RawNode } from './raw-node.js';

// Deterministic id assignment (WP-C1 §5.4): a node's id is its position path
// (`root`, `root.0`, `root.0.1`, …), so identical input always yields identical,
// unique, reproducible ids — and a source map is built in the same pass (§5.5).

/**
 * Records a source-map entry for a raw node that knows its source line.
 *
 * @param node The raw node.
 * @param id The node's assigned id.
 * @param sourceMap The accumulating source-map list.
 */
function recordSource(
  node: RawNode,
  id: string,
  sourceMap: SourceMapEntry[],
): void {
  if (node.line === undefined) return;
  sourceMap.push({
    nodeId: id,
    nodeType: node.type,
    position: { line: node.line },
    originalToken: node.originalToken,
  });
}

/**
 * Builds a validated-shape DocumentNode from a raw node and its children.
 *
 * @param node The raw node.
 * @param id The assigned id.
 * @param children The already-finalized children (if any).
 * @returns The canonical document node.
 */
function toDocumentNode(
  node: RawNode,
  id: string,
  children: DocumentNode[],
): DocumentNode {
  const result: DocumentNode = { id, type: node.type };
  if (node.attrs) result.attrs = node.attrs;
  if (node.marks) result.marks = node.marks;
  if (node.text !== undefined) result.text = node.text;
  if (children.length > 0) result.children = children;
  return result;
}

/**
 * Recursively assigns path ids, records source mapping and converts a raw node.
 *
 * @param node The raw node.
 * @param id The path id for this node.
 * @param sourceMap The accumulating source-map list.
 * @returns The finalized document node.
 */
function walk(
  node: RawNode,
  id: string,
  sourceMap: SourceMapEntry[],
): DocumentNode {
  recordSource(node, id, sourceMap);
  const children = (node.children ?? []).map((child, index) =>
    walk(child, `${id}.${index}`, sourceMap),
  );
  return toDocumentNode(node, id, children);
}

/**
 * Finalizes a raw parse tree into a validated-shape BookDocument plus its source map.
 *
 * @param root The raw root node (type 'book').
 * @param language The document language (ISO code).
 * @param schemaVersion The AST schema version (defaults to 1).
 * @returns The book document and its source map.
 */
export function finalizeDocument(
  root: RawNode,
  language: string,
  schemaVersion = 1,
): { document: BookDocument; sourceMap: SourceMapEntry[] } {
  const sourceMap: SourceMapEntry[] = [];
  const rootNode = walk(root, 'root', sourceMap);
  return { document: { schemaVersion, language, root: rootNode }, sourceMap };
}
