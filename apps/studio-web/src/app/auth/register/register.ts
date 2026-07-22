import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { isFirebaseConfigured } from '../../core/firebase/firebase-app';
import { toAuthMessage } from '../auth-error';
import { allowedBilling, allowedPlan } from '../plan';
import { verificationContinueUrl } from '../verification';

/**
 * Email/password registration (secondary entry — login is the default). On
 * success the account is created, a verification e-mail is sent and the user is
 * taken to /verify-email — never the studio. The chosen plan + billing are
 * preserved only as an allowlisted selection intent.
 */
@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected displayName = '';
  protected email = '';
  protected password = '';
  protected readonly configured = isFirebaseConfigured();
  protected readonly error = signal('');
  protected readonly busy = signal(false);
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

  /** Creates the account, sends verification and routes to /verify-email. */
  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.createAccount();
      await this.router.navigate(['/verify-email'], {
        queryParams: this.forwardParams,
      });
    } catch (error) {
      this.error.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** Creates the account with a plan/billing-carrying verification e-mail. */
  private async createAccount(): Promise<void> {
    const url = verificationContinueUrl(
      window.location.origin,
      this.plan,
      this.billing,
    );
    await this.auth.register(this.email, this.password, this.displayName, url);
  }
}
