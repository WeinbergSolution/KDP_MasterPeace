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
import { allowedPlan } from '../plan';
import { verificationContinueUrl } from '../verification';

/**
 * Email/password registration. On success the account is created, a verification
 * e-mail is sent and the user is taken to /verify-email — never to the studio.
 * The chosen plan is preserved only as an allowlisted selection intent.
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

  /** Creates the account, sends verification and routes to /verify-email. */
  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.createAccount();
      await this.router.navigateByUrl('/verify-email');
    } catch (error) {
      this.error.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** Reads the allowlisted plan and creates the account with verification. */
  private async createAccount(): Promise<void> {
    const plan = allowedPlan(this.route.snapshot.queryParamMap.get('plan'));
    const url = verificationContinueUrl(window.location.origin, plan);
    await this.auth.register(this.email, this.password, this.displayName, url);
  }
}
