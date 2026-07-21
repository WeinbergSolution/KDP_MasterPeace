// Pure helpers for the runtime env.js. Only PUBLIC Firebase client keys are ever
// emitted; admin/server variables are never included. JSON.stringify provides
// safe JavaScript string escaping. No I/O here (kept pure for tests).

export const FIREBASE_PUBLIC_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

/**
 * Picks the public Firebase keys from an env record, defaulting to empty.
 *
 * @param env The environment record (e.g. process.env).
 * @returns A record containing only the six public keys.
 */
export function pickPublicConfig(env) {
  const out = {};
  for (const key of FIREBASE_PUBLIC_KEYS)
    out[key] = typeof env[key] === 'string' ? env[key] : '';
  return out;
}

/**
 * Renders the runtime script that assigns window.__env.
 *
 * @param env The environment record.
 * @returns The JavaScript source for env.js.
 */
export function renderEnvJs(env) {
  return `window.__env = ${JSON.stringify(pickPublicConfig(env))};\n`;
}

/**
 * Lists the public keys that are missing or empty in the env record.
 *
 * @param env The environment record.
 * @returns The names of the unset public keys.
 */
export function missingKeys(env) {
  return FIREBASE_PUBLIC_KEYS.filter((key) => !env[key]);
}
