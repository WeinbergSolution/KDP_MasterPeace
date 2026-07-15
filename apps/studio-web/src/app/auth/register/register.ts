import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { toAuthMessage } from '../auth-error';

/** Email/password registration form; on success routes to the studio. */
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
  protected displayName = '';
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  /** Creates the account, shows a friendly error, and routes on success. */
  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.register(this.email, this.password, this.displayName);
      await this.router.navigateByUrl('/studio');
    } catch (error) {
      this.error.set(toAuthMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
