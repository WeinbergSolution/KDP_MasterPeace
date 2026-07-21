// Development environment: runs against the Firebase Emulator Suite. The client
// config values below are PUBLIC identifiers (not secrets); the `demo-` project
// id lets the emulator run without real credentials. Production values are
// injected via environment.prod.ts (file replacement) — see project.json.

import type { AppEnvironment } from './firebase-environment';

export const environment: AppEnvironment = {
  production: false,
  firebase: {
    config: {
      apiKey: 'demo-api-key',
      authDomain: 'localhost',
      projectId: 'demo-kdp-masterpeace',
      storageBucket: 'demo-kdp-masterpeace.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:demo',
    },
    configured: true,
    useEmulators: true,
    authEmulatorUrl: 'http://127.0.0.1:9099',
    firestoreEmulator: { host: '127.0.0.1', port: 8080 },
  },
};
