import { Injectable, inject } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE } from './firebase-app';
import { AuthService } from './auth.service';
import { isActiveEntitlement } from './entitlement';

// Reads the current user's server-controlled entitlement (entitlements/{uid}).
// The client may only READ this document — security rules forbid client writes.
// A missing document or any non-active status means no studio access. This
// package sets nothing: a later Stripe work package writes the entitlement
// server-side.

/** Reactive read access to the current user's entitlement status. */
@Injectable({ providedIn: 'root' })
export class EntitlementService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  /**
   * Reads the current user's entitlement status from Firestore.
   *
   * @returns The status string, or 'none' when signed out / missing / on error.
   */
  async currentStatus(): Promise<string> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return 'none';
    try {
      const snap = await getDoc(doc(this.db, 'entitlements', uid));
      const status = snap.exists() ? snap.data()?.['status'] : null;
      return typeof status === 'string' ? status : 'none';
    } catch {
      return 'none';
    }
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
