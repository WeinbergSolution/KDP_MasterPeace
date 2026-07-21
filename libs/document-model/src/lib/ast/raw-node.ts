import type { DocumentNode } from '@kdp/contracts';

// Internal parser node. Carries the source line so the finalize pass can build
// a source map; ids are assigned later (deterministically, by tree position).

/** A canonical Book AST node type. */
export type NodeType = DocumentNode['type'];

/** A canonical inline mark. */
export type InlineMark = NonNullable<DocumentNode['marks']>[number];

/** A parser-internal node before deterministic id assignment. */
export interface RawNode {
  type: NodeType;
  attrs?: Record<string, unknown>;
  marks?: InlineMark[];
  text?: string;
  children?: RawNode[];
  line?: number;
  originalToken?: string;
}

/**
 * Creates a raw parser node.
 *
 * @param type The node type.
 * @param props Optional node properties (attrs, text, children, line, token).
 * @returns The assembled raw node.
 */
export function raw(
  type: NodeType,
  props: Omit<Partial<RawNode>, 'type'> = {},
): RawNode {
  return { type, ...props };
}
