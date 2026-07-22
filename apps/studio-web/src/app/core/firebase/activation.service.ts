import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { EntitlementService } from './entitlement.service';

// Client side of the test-plan activation. It sends the Firebase ID token and
// the chosen plan/billing to the protected server endpoint, which verifies the
// token, derives price/limit server-side and writes the entitlement. The client
// never marks a plan as paid or writes an entitlement itself.

/** Requests a server-side test-plan activation for the signed-in user. */
@Injectable({ providedIn: 'root' })
export class ActivationService {
  private readonly auth = inject(AuthService);
  private readonly entitlement = inject(EntitlementService);

  /**
   * Activates the given plan/billing for the test phase via the server, then
   * refreshes the local entitlement. Throws a friendly message on failure.
   *
   * @param planId The chosen plan id.
   * @param billingCycle The chosen billing cycle.
   */
  async activateTestPlan(planId: string, billingCycle: string): Promise<void> {
    const token = await this.auth.idToken();
    if (!token) throw new Error('Bitte melde dich an.');
    await this.post(token, planId, billingCycle);
    await this.entitlement.refresh();
  }

  /**
   * Posts the activation request; throws a friendly message on failure.
   *
   * @param token The Firebase ID token.
   * @param planId The chosen plan id.
   * @param billingCycle The chosen billing cycle.
   */
  private async post(
    token: string,
    planId: string,
    billingCycle: string,
  ): Promise<void> {
    const res = await fetch('/api/activate-test-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planId, billingCycle }),
    });
    if (!res.ok) throw new Error(await this.message(res));
  }

  /**
   * Extracts a friendly error message from a failed response.
   *
   * @param res The failed response.
   * @returns The message to display.
   */
  private async message(res: Response): Promise<string> {
    const data = await res.json().catch(() => ({}));
    return typeof data?.error === 'string'
      ? data.error
      : 'Aktivierung fehlgeschlagen. Bitte erneut versuchen.';
  }
}
