import { Injectable, computed, inject, signal } from '@angular/core';
import {
  applyActionCode,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
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
  readonly isEmailVerified = computed(
    () => this.userSignal()?.emailVerified ?? false,
  );

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
   * Registers a new account, sets its display name and sends a German
   * verification e-mail. The account is signed in but NOT yet verified.
   *
   * @param email The account email.
   * @param password The chosen password.
   * @param displayName The user's display name.
   * @param continueUrl The same-origin continue URL for the verification e-mail.
   */
  async register(
    email: string,
    password: string,
    displayName: string,
    continueUrl?: string,
  ): Promise<void> {
    this.auth.languageCode = 'de';
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    if (displayName.trim())
      await updateProfile(cred.user, { displayName: displayName.trim() });
    await sendEmailVerification(
      cred.user,
      continueUrl ? { url: continueUrl } : null,
    );
  }

  /** Reloads the current user so a just-completed verification is reflected. */
  async reload(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    await reload(user);
    this.userSignal.set(this.auth.currentUser);
  }

  /**
   * Applies a Firebase e-mail action code (verify e-mail).
   *
   * @param oobCode The out-of-band action code from the e-mail link.
   */
  async applyEmailVerification(oobCode: string): Promise<void> {
    await applyActionCode(this.auth, oobCode);
  }

  /**
   * Signs in briefly to resend the verification e-mail, then signs out again.
   * The password is never stored.
   *
   * @param email The account email.
   * @param password The account password.
   * @param continueUrl The same-origin continue URL for the verification e-mail.
   * @returns 'already' when the address is already verified, else 'sent'.
   */
  async resendVerification(
    email: string,
    password: string,
    continueUrl?: string,
  ): Promise<'already' | 'sent'> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    try {
      if (cred.user.emailVerified) return 'already';
      this.auth.languageCode = 'de';
      const settings = continueUrl ? { url: continueUrl } : null;
      await sendEmailVerification(cred.user, settings);
      return 'sent';
    } finally {
      await signOut(this.auth);
    }
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
