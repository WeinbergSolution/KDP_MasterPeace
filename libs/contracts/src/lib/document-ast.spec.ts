import { describe, expect, it } from 'vitest';
import { BookDocumentSchema, DocumentNodeSchema } from './document-ast.js';
import { GenerationEventSchema } from './generation-event.js';

const sampleBook = {
  schemaVersion: 1,
  language: 'de',
  root: {
    id: '01J000000000000000000ROOT',
    type: 'book',
    children: [
      {
        id: '01J0000000000000000CHAP1',
        type: 'chapter',
        attrs: { title: 'Verstehen' },
        children: [
          {
            id: '01J000000000000000PARA1',
            type: 'paragraph',
            text: 'Dein Selbstwert',
            marks: ['strong'],
          },
        ],
      },
    ],
  },
};

describe('BookDocumentSchema', () => {
  it('accepts a valid nested book document', () => {
    expect(() => BookDocumentSchema.parse(sampleBook)).not.toThrow();
  });

  it('rejects an unknown node type', () => {
    const bad = { id: 'x', type: 'not-a-node', text: 'y' };
    expect(DocumentNodeSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a document without a positive schema version', () => {
    expect(
      BookDocumentSchema.safeParse({ ...sampleBook, schemaVersion: 0 }).success,
    ).toBe(false);
  });
});

describe('GenerationEventSchema', () => {
  it('validates a partial-content event carrying AST nodes', () => {
    const event = {
      type: 'partial-content',
      runId: 'run1',
      stepId: 'step1',
      nodes: [{ id: 'n1', type: 'paragraph', text: 'hello' }],
    };
    expect(GenerationEventSchema.safeParse(event).success).toBe(true);
  });

  it('validates an awaiting-confirmation event with an estimate', () => {
    const event = {
      type: 'awaiting-confirmation',
      runId: 'run1',
      estimate: { minCents: 1, expectedCents: 2, maxCents: 3, stepCount: 4 },
    };
    expect(GenerationEventSchema.safeParse(event).success).toBe(true);
  });
});
