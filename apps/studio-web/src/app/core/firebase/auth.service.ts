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
import { FIREBASE_AUTH, isFirebaseConfigured } from './firebase-app';

// Thin, framework-idiomatic wrapper over Firebase email/password auth exposing
// signals. It never stores secrets and never talks to AI/providers.

// If no auth state arrives in this window (backend/emulator unreachable) the app
// resolves as "signed out" so guarded routes render instead of hanging blank.
const READY_TIMEOUT_MS = 1500;

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
    setTimeout(() => this.markReady(), READY_TIMEOUT_MS);
    if (!isFirebaseConfigured()) {
      this.applyUser(null);
      return;
    }
    onAuthStateChanged(
      this.auth,
      (user) => this.applyUser(user),
      () => this.applyUser(null),
    );
  }

  /**
   * Applies a new auth state and opens the readiness gate.
   *
   * @param user The current Firebase user, or null when signed out.
   */
  private applyUser(user: User | null): void {
    this.userSignal.set(user);
    this.markReady();
  }

  /** Opens the readiness gate exactly once. */
  private markReady(): void {
    if (this.readySignal()) return;
    this.readySignal.set(true);
    this.resolveReady();
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
