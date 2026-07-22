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

/**
 * Email/password sign-in. Routes by gate: unverified → /verify-email; verified
 * without an active entitlement → /tarif-waehlen; verified + entitled → /studio.
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

  /** Signs in, then routes by the current gate (verify / plan / studio). */
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
   * Computes the post-login destination from the verification + entitlement gate.
   *
   * @returns /verify-email, /tarif-waehlen or /studio.
   */
  private async destination(): Promise<string> {
    if (!this.auth.isEmailVerified()) return '/verify-email';
    const active = await this.entitlement.hasActiveAccess();
    return active ? '/studio' : '/tarif-waehlen';
  }
}
