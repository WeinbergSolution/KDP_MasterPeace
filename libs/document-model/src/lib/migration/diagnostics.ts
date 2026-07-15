import type { BookDocument } from '@kdp/contracts';

// Structured parser diagnostics (WP-C1 §6.2/§6.4). Warnings and errors are
// machine-readable, positioned and never silently dropped.

/** Severity of a parser diagnostic. */
export type DiagnosticSeverity = 'info' | 'warning' | 'error';

/** A location in the source markup (1-based lines). */
export interface SourcePosition {
  readonly line: number;
  readonly endLine?: number;
}

/** A documented, non-fatal migration deviation (stable MW-* code). */
export interface MigrationWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly position: SourcePosition;
  readonly nodeId?: string;
  readonly context?: Record<string, unknown>;
  readonly action?: string;
}

/** A fatal or structural parse problem (stable PE-* code). */
export interface ParseError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error';
  readonly position?: SourcePosition;
  readonly context?: Record<string, unknown>;
}

/** Maps a produced AST node back to its originating source markup. */
export interface SourceMapEntry {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly position: SourcePosition;
  readonly originalToken?: string;
}

/** The full, structured result of a legacy parse (WP-C1 §6.2). */
export interface LegacyParseResult {
  readonly document: BookDocument | null;
  readonly warnings: MigrationWarning[];
  readonly errors: ParseError[];
  readonly sourceMap: SourceMapEntry[];
}
