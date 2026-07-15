export { parseMarkup } from './lib/parser/parse-markup.js';
export {
  importLegacyBackup,
  LegacyImporter,
} from './lib/parser/legacy-importer.js';
export { validateDocument } from './lib/validation/validate-document.js';
export { finalizeDocument } from './lib/ast/finalize.js';
export { MW } from './lib/migration/warning-codes.js';
export type {
  LegacyParseResult,
  MigrationWarning,
  ParseError,
  SourceMapEntry,
  SourcePosition,
  DiagnosticSeverity,
} from './lib/migration/diagnostics.js';
export type { RawNode, NodeType, InlineMark } from './lib/ast/raw-node.js';
