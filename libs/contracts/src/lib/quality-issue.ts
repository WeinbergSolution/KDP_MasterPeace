import { z } from 'zod';

// QualityIssue contract (data-model.md §2, Masterprompt §9). Every quality rule
// emits structured issues with exact AST localisation so a single issue can be
// repaired without regenerating its chapter.

/** Severity of a quality issue. */
export const QualitySeveritySchema = z.enum([
  'info',
  'warning',
  'error',
  'blocking',
]);

/** The AST scope a quality issue applies to. */
export const QualityScopeSchema = z.enum([
  'book',
  'chapter',
  'section',
  'node',
  'export',
]);

/** Lifecycle status of a quality issue. */
export const QualityIssueStatusSchema = z.enum([
  'open',
  'proposed',
  'resolved',
  'ignored',
]);

/** A structured, addressable quality finding on a book version. */
export const QualityIssueSchema = z.object({
  id: z.string().min(1),
  bookVersionId: z.string().min(1),
  ruleId: z.string().min(1),
  severity: QualitySeveritySchema,
  scopeType: QualityScopeSchema,
  scopeId: z.string().min(1),
  chapterId: z.string().optional(),
  nodeId: z.string().optional(),
  locale: z.string().min(2),
  messageKey: z.string().min(1),
  evidence: z.record(z.string(), z.unknown()).optional(),
  deterministicFixAvailable: z.boolean(),
  aiRepairAvailable: z.boolean(),
  status: QualityIssueStatusSchema,
});

/** A structured, addressable quality finding on a book version. */
export type QualityIssue = z.infer<typeof QualityIssueSchema>;
