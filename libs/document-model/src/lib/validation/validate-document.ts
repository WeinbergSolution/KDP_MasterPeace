import { BookDocumentSchema, type BookDocument } from '@kdp/contracts';
import type { ZodIssue } from 'zod';
import type { ParseError } from '../migration/diagnostics.js';

// AST validation against the canonical Zod schema (libs/contracts). The parser
// never emits an unvalidated document (WP-C1 §5.1).

/**
 * Converts a Zod issue into a structured parse error.
 *
 * @param issue The Zod validation issue.
 * @returns A parse error with a stable PE-AST-INVALID code.
 */
function toParseError(issue: ZodIssue): ParseError {
  const path = issue.path.join('.') || '(root)';
  return {
    code: 'PE-AST-INVALID',
    message: `${path}: ${issue.message}`,
    severity: 'error',
    context: { path },
  };
}

/**
 * Validates a candidate document against the canonical Book AST schema.
 *
 * @param candidate The document to validate.
 * @returns The validated document (or null) and any structural errors.
 */
export function validateDocument(candidate: unknown): {
  document: BookDocument | null;
  errors: ParseError[];
} {
  const result = BookDocumentSchema.safeParse(candidate);
  if (result.success) return { document: result.data, errors: [] };
  return { document: null, errors: result.error.issues.map(toParseError) };
}
