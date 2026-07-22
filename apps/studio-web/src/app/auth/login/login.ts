import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { EntitlementService } from '../../core/firebase/entitlement.service';
import { isFirebaseConfigured } from '../../core/firebase/firebase-app';
import { toAuthMessage } from '../auth-error';
import { allowedBilling, allowedPlan } from '../plan';

/**
 * Email/password sign-in — the default entry point for existing users. Routes by
 * gate after login: unverified → /verify-email; verified without entitlement →
 * /checkout (when a plan was chosen) or /tarif-waehlen; verified + entitled →
 * /studio. The chosen plan + billing are preserved as an allowlisted intent.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly entitlement = inject(EntitlementService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected email = '';
  protected password = '';
  protected readonly configured = isFirebaseConfigured();
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly verifiedHint =
    this.route.snapshot.queryParamMap.get('verified') === '1';
  private readonly plan = allowedPlan(
    this.route.snapshot.queryParamMap.get('plan'),
  );
  private readonly billing = allowedBilling(
    this.route.snapshot.queryParamMap.get('billing'),
  );
  protected readonly forwardParams = this.buildParams();

  /** Builds the allowlisted plan/billing query params to forward. */
  private buildParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.plan) params['plan'] = this.plan;
    if (this.billing) params['billing'] = this.billing;
    return params;
  }

  /** Signs in, then routes by the current gate (verify / plan / checkout / studio). */
  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      await this.auth.reload();
      await this.router.navigateByUrl(await this.destination());
    } catch (error) {
      this.error.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Computes the post-login destination from the verification + entitlement gate
   * (and any chosen plan/billing).
   *
   * @returns The route to navigate to.
   */
  private async destination(): Promise<string> {
    if (!this.auth.isEmailVerified()) return '/verify-email';
    if (await this.entitlement.hasActiveAccess()) return '/studio';
    return this.plan
      ? `/checkout?plan=${this.plan}&billing=${this.billing ?? 'monthly'}`
      : '/tarif-waehlen';
  }
}
