import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  FIREBASE_AUTH,
  FIRESTORE,
  createAuth,
  createFirestore,
} from './core/firebase/firebase-app';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    { provide: FIREBASE_AUTH, useFactory: createAuth },
    { provide: FIRESTORE, useFactory: createFirestore },
  ],
};
