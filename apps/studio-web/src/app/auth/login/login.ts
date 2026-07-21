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

/**
 * Email/password sign-in. A verified account continues to the studio; an
 * unverified account is sent to /verify-email and gains no protected access.
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected email = '';
  protected password = '';
  protected readonly configured = isFirebaseConfigured();
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly verifiedHint =
    this.route.snapshot.queryParamMap.get('verified') === '1';

  /** Signs in, then routes verified users to the studio and others to verify. */
  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      await this.auth.reload();
      const target = this.auth.isEmailVerified() ? '/studio' : '/verify-email';
      await this.router.navigateByUrl(target);
    } catch (error) {
      this.error.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
