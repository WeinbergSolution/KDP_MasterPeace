import { raw, type RawNode } from '../ast/raw-node.js';
import { finalizeDocument } from '../ast/finalize.js';
import type {
  LegacyParseResult,
  MigrationWarning,
  SourceMapEntry,
} from '../migration/diagnostics.js';
import { validateDocument } from '../validation/validate-document.js';
import { BlockParser } from './block-parser.js';

/**
 * Enriches warnings with the id of the node produced at the same source line.
 *
 * @param warnings The raw warnings from the block parser.
 * @param sourceMap The finalized source map.
 * @returns Warnings with `nodeId` filled in where a match exists.
 */
export function enrichWarnings(
  warnings: MigrationWarning[],
  sourceMap: SourceMapEntry[],
): MigrationWarning[] {
  const byLine = new Map<number, string>();
  for (const entry of sourceMap)
    if (!byLine.has(entry.position.line))
      byLine.set(entry.position.line, entry.nodeId);
  return warnings.map((warning) =>
    warning.nodeId || !byLine.has(warning.position.line)
      ? warning
      : { ...warning, nodeId: byLine.get(warning.position.line) },
  );
}

/**
 * Finalizes a raw root into a validated result (document, warnings, sourceMap).
 *
 * @param root The raw root node.
 * @param language The document language.
 * @param warnings The collected migration warnings.
 * @returns The complete, validated parse result.
 */
export function finalizeResult(
  root: RawNode,
  language: string,
  warnings: MigrationWarning[],
): LegacyParseResult {
  const { document, sourceMap } = finalizeDocument(root, language);
  const validation = validateDocument(document);
  return {
    document: validation.document,
    warnings: enrichWarnings(warnings, sourceMap),
    errors: validation.errors,
    sourceMap,
  };
}

/**
 * Parses a standalone markup string into a single-section Book AST (editor path).
 *
 * @param markup The legacy markup string.
 * @param options Optional document language (defaults to 'de').
 * @returns The validated parse result.
 */
export function parseMarkup(
  markup: string,
  options: { language?: string } = {},
): LegacyParseResult {
  const { blocks, warnings } = new BlockParser().parse(markup);
  const root = raw('book', {
    children: [raw('section', { children: blocks })],
  });
  return finalizeResult(root, options.language ?? 'de', warnings);
}
