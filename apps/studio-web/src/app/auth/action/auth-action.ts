import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { toAuthMessage } from '../auth-error';
import { parseVerifyAction } from '../verification';

type ActionState = 'loading' | 'success' | 'invalid' | 'error';

/**
 * Public Firebase e-mail-action handler for the verifyEmail flow only. It
 * validates mode/oobCode, applies the code and routes to our own /login — never
 * to an external continueUrl (no open redirects). An allowlisted plan id may be
 * preserved. Invalid, expired or already-used links show a friendly state.
 */
@Component({
  selector: 'app-auth-action',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './auth-action.html',
  styleUrl: './auth-action.scss',
})
export class AuthActionComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly state = signal<ActionState>('loading');
  protected readonly message = signal('');
  private loginTarget = '/login?verified=1';

  /** Validates the e-mail-action params and applies the verification code. */
  async ngOnInit(): Promise<void> {
    const map = this.route.snapshot.queryParamMap;
    const action = parseVerifyAction((k) => map.get(k), window.location.origin);
    this.loginTarget = action.loginTarget;
    if (!action.valid) {
      this.fail(
        'invalid',
        'Dieser Bestätigungslink ist unvollständig oder ungültig.',
      );
      return;
    }
    await this.confirm(action.oobCode);
  }

  /** Applies the verification code and reflects success or a friendly error. */
  private async confirm(oobCode: string): Promise<void> {
    try {
      await this.auth.applyEmailVerification(oobCode);
      this.state.set('success');
      this.message.set('E-Mail-Adresse erfolgreich bestätigt.');
    } catch (error) {
      this.fail('error', toAuthMessage(error));
    }
  }

  /**
   * Sets a failure state and message.
   *
   * @param state The failure state.
   * @param message The user-facing message.
   */
  private fail(state: ActionState, message: string): void {
    this.state.set(state);
    this.message.set(message);
  }

  /** Navigates to our own login page, preserving an allowlisted plan. */
  protected goLogin(): void {
    void this.router.navigateByUrl(this.loginTarget);
  }
}
