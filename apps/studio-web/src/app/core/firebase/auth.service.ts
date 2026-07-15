import { Injectable, computed, inject, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { FIREBASE_AUTH } from './firebase-app';

// Thin, framework-idiomatic wrapper over Firebase email/password auth exposing
// signals. It never stores secrets and never talks to AI/providers.

/** Reactive Firebase email/password authentication state and actions. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly userSignal = signal<User | null>(null);
  private readonly readySignal = signal(false);
  private resolveReady!: () => void;
  private readonly readyPromise = new Promise<void>((r) => {
    this.resolveReady = r;
  });

  readonly currentUser = this.userSignal.asReadonly();
  readonly isReady = this.readySignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  constructor() {
    onAuthStateChanged(this.auth, (user) => this.applyUser(user));
  }

  /**
   * Applies a new auth state and resolves the readiness gate once.
   *
   * @param user The current Firebase user, or null when signed out.
   */
  private applyUser(user: User | null): void {
    this.userSignal.set(user);
    if (!this.readySignal()) {
      this.readySignal.set(true);
      this.resolveReady();
    }
  }

  /**
   * Waits for the first auth state, then reports whether a user is signed in.
   *
   * @returns True when authenticated after initialization.
   */
  async whenReady(): Promise<boolean> {
    await this.readyPromise;
    return this.isAuthenticated();
  }

  /**
   * Registers a new account and sets its display name.
   *
   * @param email The account email.
   * @param password The chosen password.
   * @param displayName The user's display name.
   */
  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    if (displayName.trim())
      await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  /**
   * Signs in with email and password.
   *
   * @param email The account email.
   * @param password The account password.
   */
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Sends a password-reset email.
   *
   * @param email The account email.
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /** Signs the current user out. */
  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
