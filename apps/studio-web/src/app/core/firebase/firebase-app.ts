import { InjectionToken } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';

// Single Firebase app instance + DI tokens for Auth and Firestore. In dev both
// connect to the Firebase Emulator Suite; in prod they use the injected public
// config. No provider keys or secrets live here.

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');

let cachedApp: FirebaseApp | null = null;

/**
 * Reports whether a usable Firebase project config is present.
 *
 * @returns True when a non-empty project id is configured.
 */
export function isFirebaseConfigured(): boolean {
  return environment.firebase.configured;
}

/**
 * Initializes the Firebase app once and returns the shared instance.
 *
 * @returns The singleton FirebaseApp.
 */
function firebaseApp(): FirebaseApp {
  cachedApp ??= initializeApp(environment.firebase.config);
  return cachedApp;
}

/**
 * Creates the Auth instance, wired to the emulator in development.
 *
 * @returns The configured Firebase Auth instance.
 */
export function createAuth(): Auth {
  const auth = getAuth(firebaseApp());
  if (environment.firebase.useEmulators)
    connectAuthEmulator(auth, environment.firebase.authEmulatorUrl, {
      disableWarnings: true,
    });
  return auth;
}

/**
 * Creates the Firestore instance, wired to the emulator in development.
 *
 * @returns The configured Firestore instance.
 */
export function createFirestore(): Firestore {
  const db = getFirestore(firebaseApp());
  const emu = environment.firebase.firestoreEmulator;
  if (environment.firebase.useEmulators)
    connectFirestoreEmulator(db, emu.host, emu.port);
  return db;
}
