import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChevronDown, LucideAngularModule, User } from 'lucide-angular';
import { AuthService } from '../../core/firebase/auth.service';
import { EntitlementService } from '../../core/firebase/entitlement.service';

const PLAN_LABELS: Record<string, string> = {
  tester: 'Tester',
  starter: 'Starter',
  creator: 'Creator',
  pro: 'Pro',
};

/**
 * Landing header that reflects the auth + entitlement state without flicker:
 * logged out (Tarife/Anmelden/Jetzt starten), logged-in unverified (E-Mail
 * bestätigen), verified without plan (Tarif wählen), and active plan (Weiter zum
 * <Plan>-Bereich → studio). Includes an account menu and in-place logout.
 */
@Component({
  selector: 'app-landing-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './landing-header.html',
  styleUrl: './landing-header.scss',
})
export class LandingHeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly entitlement = inject(EntitlementService);
  private readonly router = inject(Router);

  protected readonly ready = this.auth.isReady;
  protected readonly authed = this.auth.isAuthenticated;
  protected readonly verified = this.auth.isEmailVerified;
  protected readonly name = this.auth.displayName;
  protected readonly active = this.entitlement.isActive;
  protected readonly ent = this.entitlement.entitlement;
  protected readonly menuOpen = signal(false);
  protected readonly userIcon = User;
  protected readonly chevron = ChevronDown;

  constructor() {
    effect(() => {
      if (this.ready() && this.authed() && this.verified())
        void this.entitlement.refresh();
    });
  }

  /** The signed-in user's initial for the avatar. */
  protected initial(): string {
    const value = this.name().trim();
    return value ? value[0].toUpperCase() : '?';
  }

  /** The active plan's display label (e.g. "Creator"). */
  protected planLabel(): string {
    return PLAN_LABELS[this.ent()?.planId ?? ''] ?? '';
  }

  /** Toggles the account menu. */
  protected toggle(): void {
    this.menuOpen.update((v) => !v);
  }

  /** Closes the account menu. */
  protected close(): void {
    this.menuOpen.set(false);
  }

  /** Signs out, clears the entitlement and returns to the landing page. */
  protected async logout(): Promise<void> {
    this.close();
    await this.auth.logout();
    this.entitlement.clear();
    await this.router.navigateByUrl('/');
  }
}
