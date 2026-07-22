import { Injectable, computed, inject, signal } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE } from './firebase-app';
import { AuthService } from './auth.service';
import { isActiveEntitlement } from './entitlement';

// Reads the current user's server-controlled entitlement (entitlements/{uid}).
// The client may only READ this document — security rules forbid client writes.
// A missing document or any non-active status means no studio access. The status
// is exposed as a signal so the landing header/account can react without flicker;
// call refresh() after login / activation, and clear() on logout.

/** A read-only view of the current entitlement. */
export interface Entitlement {
  readonly status: string;
  readonly planId?: string;
  readonly billingCycle?: string;
  readonly bookLimit?: number;
  readonly source?: string;
}

/** Reactive read access to the current user's entitlement. */
@Injectable({ providedIn: 'root' })
export class EntitlementService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);
  private readonly stateSignal = signal<Entitlement | null>(null);

  readonly entitlement = this.stateSignal.asReadonly();
  readonly isActive = computed(() =>
    isActiveEntitlement(this.stateSignal()?.status),
  );

  /** Refreshes the entitlement signal from Firestore for the current user. */
  async refresh(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) {
      this.stateSignal.set(null);
      return;
    }
    try {
      const snap = await getDoc(doc(this.db, 'entitlements', uid));
      this.stateSignal.set(snap.exists() ? (snap.data() as Entitlement) : null);
    } catch {
      this.stateSignal.set(null);
    }
  }

  /** Clears the cached entitlement (on sign-out). */
  clear(): void {
    this.stateSignal.set(null);
  }

  /**
   * Reads (refreshing) the current entitlement status.
   *
   * @returns The status, or 'none'.
   */
  async currentStatus(): Promise<string> {
    await this.refresh();
    return this.stateSignal()?.status ?? 'none';
  }

  /**
   * Reports whether the current user has an active studio entitlement.
   *
   * @returns True only for an 'active' or 'trialing' entitlement.
   */
  async hasActiveAccess(): Promise<boolean> {
    return isActiveEntitlement(await this.currentStatus());
  }
}
