// Redaction for structured logs (AGENTS.md §9.2): never log secrets, full
// manuscripts or unmasked PII. Applied to every log field before serialization.

const SECRET_KEY =
  /(pass|secret|token|key|authorization|credential|api[-_]?key|manuscript|ciphertext)/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REDACTED = '[REDACTED]';

/**
 * Masks an email address, keeping only its first character and domain.
 *
 * @param email A syntactically valid email address.
 * @returns The masked email, e.g. `a***@example.com`.
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

/**
 * Redacts a single key/value pair: secret-looking keys are removed entirely and
 * email values are masked; everything else is recursed into.
 *
 * @param key The property name.
 * @param value The property value.
 * @returns The redacted value.
 */
function redactEntry(key: string, value: unknown): unknown {
  if (SECRET_KEY.test(key)) return REDACTED;
  if (typeof value === 'string' && EMAIL.test(value)) return maskEmail(value);
  return redact(value);
}

/**
 * Recursively redacts secrets and PII from an object.
 *
 * @param obj The record to redact.
 * @returns A new record with sensitive fields removed or masked.
 */
function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj))
    out[key] = redactEntry(key, value);
  return out;
}

/**
 * Recursively redacts secrets and PII from any log value.
 *
 * @param input The value to redact (object, array or primitive).
 * @returns The redacted value, structurally cloned where needed.
 */
export function redact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(redact);
  if (input !== null && typeof input === 'object')
    return redactObject(input as Record<string, unknown>);
  return input;
}
