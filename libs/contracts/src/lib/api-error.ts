import { z } from 'zod';

// Uniform API error contract (target-architecture.md §4). Every error response
// carries a stable machine code plus an i18n message key; errors are never
// presented to users as success (AGENTS.md §9.3).

/** Machine-readable API error classes. */
export const ApiErrorCodeSchema = z.enum([
  'validation-failed',
  'unauthorized',
  'forbidden',
  'not-found',
  'version-conflict',
  'rate-limited',
  'provider-unavailable',
  'internal-error',
]);

/** A structured API error body with correlation id for tracing. */
export const ApiErrorSchema = z.object({
  code: ApiErrorCodeSchema,
  messageKey: z.string().min(1),
  correlationId: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
});

/** A structured API error body with correlation id for tracing. */
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** A structured API error body with correlation id for tracing. */
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
