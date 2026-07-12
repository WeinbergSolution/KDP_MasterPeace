import { z } from 'zod';

// Environment contract (WP-B4). Server processes call parseEnv(process.env) at
// startup and fail fast on any invalid/missing variable, so misconfiguration is
// never silently tolerated (AGENTS.md §8).

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

/** Validated environment schema shared by api and worker. */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  DEMO_MODE: booleanString,
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CREDENTIAL_ENC_KEY: z.string().min(32).optional(),
});

/** The validated, typed environment. */
export type Env = z.infer<typeof EnvSchema>;

/**
 * Formats Zod validation issues into a single readable, deterministic message.
 *
 * @param error The Zod error produced by a failed parse.
 * @returns A newline-joined `PATH: message` list.
 */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Parses and validates raw environment variables, failing fast on any error.
 *
 * @param source Raw environment source (defaults to an empty object).
 * @returns The validated, typed environment.
 * @throws If any variable is missing or invalid.
 */
export function parseEnv(source: Record<string, string | undefined> = {}): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success)
    throw new Error(`Invalid environment:\n${formatIssues(result.error)}`);
  return result.data;
}
