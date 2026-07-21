import { z } from 'zod';

// Canonical Book AST contract (data-model.md §3, ADR-0010). This Zod schema is
// the single source of truth for document validation across preview, quality
// and every export renderer. Node ids are ULIDs, stable across versions.

/** All node types of the canonical Book AST (Masterprompt §3.2). */
export const NodeTypeSchema = z.enum([
  'book',
  'frontMatter',
  'backMatter',
  'chapter',
  'section',
  'heading',
  'paragraph',
  'quote',
  // Inline text run carrying optional marks (strong/emphasis). Required to
  // represent partial `**bold**` spans inside a block (WP-C1, controlled
  // extension per legacy markup grammar).
  'text',
  'unorderedList',
  'orderedList',
  'listItem',
  'checklist',
  'checkItem',
  'writingLines',
  'scale',
  'exerciseBox',
  'tipBox',
  'exampleBox',
  'image',
  'caption',
  'pageBreak',
  'table',
  'tableRow',
  'tableCell',
  'tableOfContents',
  'legalNotice',
  'authorProfile',
]);

/** Inline text marks (applied only to text-bearing leaf nodes). */
export const InlineMarkSchema = z.enum(['strong', 'emphasis']);

/** A single node of the Book AST. */
export interface DocumentNode {
  id: string;
  type: z.infer<typeof NodeTypeSchema>;
  attrs?: Record<string, unknown>;
  marks?: Array<z.infer<typeof InlineMarkSchema>>;
  text?: string;
  children?: DocumentNode[];
}

/** Recursive Zod schema for a Book AST node. */
export const DocumentNodeSchema: z.ZodType<DocumentNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: NodeTypeSchema,
    attrs: z.record(z.string(), z.unknown()).optional(),
    marks: z.array(InlineMarkSchema).optional(),
    text: z.string().optional(),
    children: z.array(DocumentNodeSchema).optional(),
  }),
);

/** A complete, versioned book document with a `book` root node. */
export const BookDocumentSchema = z.object({
  schemaVersion: z.number().int().positive(),
  language: z.string().min(2),
  root: DocumentNodeSchema,
});

/** A complete, versioned book document with a `book` root node. */
export type BookDocument = z.infer<typeof BookDocumentSchema>;
