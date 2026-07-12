import { z } from 'zod';
import { DocumentNodeSchema } from './document-ast.js';

// SSE generation events (data-model.md §3, target-architecture.md §4). The UI
// renders partial AST nodes as they stream in ('partial-content') and shows a
// confirmation step before any paid run ('awaiting-confirmation').

/** Cost/estimate summary presented before a run is confirmed. */
export const RunEstimateSchema = z.object({
  minCents: z.number().nonnegative(),
  expectedCents: z.number().nonnegative(),
  maxCents: z.number().nonnegative(),
  stepCount: z.number().int().nonnegative(),
});

/** Simple lifecycle phases that carry only run/step identifiers. */
export const GenerationPhaseSchema = z.enum([
  'queued',
  'estimating',
  'running',
  'validating',
  'repairing',
  'saving',
  'completed',
  'cancelled',
]);

/** The discriminated union of all generation SSE events. */
export const GenerationEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: GenerationPhaseSchema,
    runId: z.string(),
    stepId: z.string().optional(),
  }),
  z.object({
    type: z.literal('awaiting-confirmation'),
    runId: z.string(),
    estimate: RunEstimateSchema,
  }),
  z.object({
    type: z.literal('partial-content'),
    runId: z.string(),
    stepId: z.string(),
    nodes: z.array(DocumentNodeSchema),
  }),
  z.object({
    type: z.literal('failed'),
    runId: z.string(),
    stepId: z.string().optional(),
    errorClass: z.string(),
    messageKey: z.string(),
  }),
]);

/** The discriminated union of all generation SSE events. */
export type GenerationEvent = z.infer<typeof GenerationEventSchema>;
