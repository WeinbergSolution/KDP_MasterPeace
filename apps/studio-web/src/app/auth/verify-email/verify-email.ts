import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { toAuthMessage } from '../auth-error';
import { allowedBilling, allowedPlan } from '../plan';
import { verificationContinueUrl } from '../verification';

const COOLDOWN_S = 60;

/**
 * Public "confirm your e-mail" page. Explains the verification step and offers a
 * safe resend that briefly re-authenticates and signs out again — the password
 * is never stored. A 60-second cooldown throttles resends.
 */
@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmailComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected email = '';
  protected password = '';
  protected readonly showForm = signal(false);
  protected readonly busy = signal(false);
  protected readonly notice = signal('');
  protected readonly noticeOk = signal(false);
  protected readonly cooldown = signal(0);
  private timer: ReturnType<typeof setInterval> | undefined;

  /** Toggles the resend form. */
  protected toggleForm(): void {
    this.showForm.update((v) => !v);
  }

  /** Resends the verification e-mail after a brief re-authentication. */
  protected async resend(): Promise<void> {
    if (this.busy() || this.cooldown() > 0) return;
    this.busy.set(true);
    this.notice.set('');
    try {
      this.showResult(await this.sendResend());
    } catch (error) {
      this.noticeOk.set(false);
      this.notice.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Re-sends the verification e-mail with the carried plan/billing.
   *
   * @returns 'already' when already verified, else 'sent'.
   */
  private async sendResend(): Promise<'already' | 'sent'> {
    const query = this.route.snapshot.queryParamMap;
    const plan = allowedPlan(query.get('plan'));
    const billing = allowedBilling(query.get('billing'));
    const url = verificationContinueUrl(window.location.origin, plan, billing);
    return this.auth.resendVerification(this.email, this.password, url);
  }

  /** Reflects a resend result and starts the cooldown. */
  private showResult(result: 'already' | 'sent'): void {
    this.noticeOk.set(true);
    this.notice.set(
      result === 'already'
        ? 'Deine E-Mail-Adresse ist bereits bestätigt. Du kannst dich jetzt anmelden.'
        : 'Bestätigungs-E-Mail gesendet. Bitte prüfe dein Postfach.',
    );
    this.startCooldown();
  }

  /** Starts the 60-second resend cooldown. */
  private startCooldown(): void {
    this.cooldown.set(COOLDOWN_S);
    this.timer = setInterval(() => {
      this.cooldown.update((s) => s - 1);
      if (this.cooldown() <= 0) clearInterval(this.timer);
    }, 1000);
  }

  /** Clears the cooldown timer on destroy. */
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
