// Shared environment types. Kept separate from environment.ts so the production
// file replacement (environment.ts -> environment.prod.ts) never turns a type
// import into a circular self-import.

/** Public Firebase client configuration + emulator wiring. */
export interface FirebaseEnvironment {
  readonly config: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly storageBucket: string;
    readonly messagingSenderId: string;
    readonly appId: string;
  };
  readonly useEmulators: boolean;
  readonly authEmulatorUrl: string;
  readonly firestoreEmulator: { readonly host: string; readonly port: number };
}

/** The resolved app environment. */
export interface AppEnvironment {
  readonly production: boolean;
  readonly firebase: FirebaseEnvironment;
}
