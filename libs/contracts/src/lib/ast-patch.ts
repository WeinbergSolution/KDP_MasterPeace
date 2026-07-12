import { z } from 'zod';
import { DocumentNodeSchema } from './document-ast.js';

// AST patch contract (data-model.md §3): the ONLY format in which repairs are
// applied. A patch is bound to a base AST hash so it can never apply to a
// diverged document (single-node repair, never chapter regeneration).

/** A single patch operation against an addressable AST node. */
export const AstPatchOpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('replaceNode'),
    nodeId: z.string(),
    node: DocumentNodeSchema,
  }),
  z.object({
    op: z.literal('insertAfter'),
    nodeId: z.string(),
    node: DocumentNodeSchema,
  }),
  z.object({
    op: z.literal('insertBefore'),
    nodeId: z.string(),
    node: DocumentNodeSchema,
  }),
  z.object({
    op: z.literal('insertChild'),
    parentId: z.string(),
    index: z.number().int().nonnegative(),
    node: DocumentNodeSchema,
  }),
  z.object({ op: z.literal('removeNode'), nodeId: z.string() }),
  z.object({
    op: z.literal('setAttrs'),
    nodeId: z.string(),
    attrs: z.record(z.string(), z.unknown()),
  }),
]);

/** A conflict-guarded batch of patch operations. */
export const AstPatchSchema = z.object({
  baseAstHash: z.string().min(1),
  ops: z.array(AstPatchOpSchema).min(1),
});

/** A conflict-guarded batch of patch operations. */
export type AstPatch = z.infer<typeof AstPatchSchema>;

/** A single patch operation against an addressable AST node. */
export type AstPatchOp = z.infer<typeof AstPatchOpSchema>;
