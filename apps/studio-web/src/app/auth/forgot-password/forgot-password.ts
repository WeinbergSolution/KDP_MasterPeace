import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { toAuthMessage } from '../auth-error';

/** Requests a password-reset email for the entered address. */
@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  protected email = '';
  protected readonly error = signal('');
  protected readonly sent = signal(false);
  protected readonly busy = signal(false);

  /** Sends the reset email and reflects success or a friendly error. */
  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.sent.set(false);
    try {
      await this.auth.resetPassword(this.email);
      this.sent.set(true);
    } catch (error) {
      this.error.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
