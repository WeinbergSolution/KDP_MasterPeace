// Post-build step: writes the runtime env.js into the built browser output using
// the public Firebase env vars present at build time (Vercel project settings).
// Missing vars are written as empty strings (the app then shows a clear config
// error, never a white screen); this keeps CI/local prod builds working too.

import { writeFileSync } from 'node:fs';
import {
  FIREBASE_PUBLIC_KEYS,
  missingKeys,
  renderEnvJs,
} from './render-env-js.mjs';

const TARGET =
  process.env.ENV_JS_TARGET ?? 'dist/apps/studio-web/browser/env.js';

/** Generates env.js in the browser output and reports coverage. */
function main() {
  writeFileSync(TARGET, renderEnvJs(process.env));
  const missing = missingKeys(process.env);
  const set = FIREBASE_PUBLIC_KEYS.length - missing.length;
  const note = missing.length ? `; missing: ${missing.join(', ')}` : '';
  process.stdout.write(
    `env.js written to ${TARGET} (${set}/6 public keys)${note}\n`,
  );
}

main();
