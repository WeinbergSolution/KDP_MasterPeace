// Production environment. Firebase client config is read from build-time public
// env vars (Vercel project settings). These are PUBLIC identifiers, not secrets.
// Until the real Firebase project is provisioned and injected, deploying without
// these values leaves auth unconfigured (the app surfaces "Integration nicht
// konfiguriert" rather than faking a session). No emulator in production.

import type {
  AppEnvironment,
  FirebaseEnvironment,
} from './firebase-environment';

/**
 * Reads a public build-time env var, tolerating absence (returns empty string).
 *
 * @param key The environment variable name.
 * @returns The value, or an empty string when undefined.
 */
function readEnv(key: string): string {
  const bag = (globalThis as { __env?: Record<string, string> }).__env ?? {};
  return bag[key] ?? '';
}

const projectId = readEnv('FIREBASE_PROJECT_ID');

// Fallbacks keep Firebase init from throwing when unconfigured; `configured`
// reflects whether real values were injected. When false, the UI shows
// "Integration nicht konfiguriert" instead of faking a session.
const firebase: FirebaseEnvironment = {
  config: {
    apiKey: readEnv('FIREBASE_API_KEY') || 'unconfigured',
    authDomain: readEnv('FIREBASE_AUTH_DOMAIN') || 'localhost',
    projectId: projectId || 'unconfigured',
    storageBucket:
      readEnv('FIREBASE_STORAGE_BUCKET') || 'unconfigured.appspot.com',
    messagingSenderId:
      readEnv('FIREBASE_MESSAGING_SENDER_ID') || '000000000000',
    appId: readEnv('FIREBASE_APP_ID') || '1:000000000000:web:unconfigured',
  },
  configured: projectId !== '',
  useEmulators: false,
  authEmulatorUrl: '',
  firestoreEmulator: { host: '', port: 0 },
};

export const environment: AppEnvironment = { production: true, firebase };
