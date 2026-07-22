import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  LucideAngularModule,
} from 'lucide-angular';
import { AuthService } from '../../core/firebase/auth.service';
import { EntitlementService } from '../../core/firebase/entitlement.service';
import { avatarInitials, isTestPhaseAccess, planLineText } from './topbar-plan';

/**
 * Compact, additive account/navigation bar above the studio. It reuses the same
 * auth + entitlement state as the landing header (no parallel logic, no
 * re-hardcoded tariff data) and never touches the studio workflow below it. It
 * shows the active plan, the user's initials and an accessible account menu.
 */
@Component({
  selector: 'app-studio-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './studio-topbar.html',
  styleUrl: './studio-topbar.scss',
  host: { '(keydown.escape)': 'close()' },
})
export class StudioTopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly entitlement = inject(EntitlementService);
  private readonly router = inject(Router);

  protected readonly ready = this.auth.isReady;
  protected readonly name = this.auth.displayName;
  protected readonly email = computed(
    () => this.auth.currentUser()?.email ?? '',
  );
  protected readonly active = this.entitlement.isActive;
  protected readonly ent = this.entitlement.entitlement;
  protected readonly menuOpen = signal(false);

  protected readonly backIcon = ArrowLeft;
  protected readonly brandIcon = BookOpen;
  protected readonly chevron = ChevronDown;

  constructor() {
    effect(() => {
      if (this.ready() && this.auth.isAuthenticated())
        void this.entitlement.refresh();
    });
  }

  /** The compact plan line for the header (e.g. "Creator · jährlich"). */
  protected planLine(): string {
    const entitlement = this.ent();
    return planLineText(entitlement?.planId, entitlement?.billingCycle);
  }

  /** Whether the active plan is a test-phase access (dezente Notiz). */
  protected testAccess(): boolean {
    return isTestPhaseAccess(this.ent()?.source);
  }

  /** The avatar initials for the signed-in user. */
  protected initials(): string {
    return avatarInitials(this.name());
  }

  /** Toggles the account menu. */
  protected toggle(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Closes the account menu. */
  protected close(): void {
    this.menuOpen.set(false);
  }

  /**
   * Signs out, resets the client entitlement state and returns to the landing
   * page (the studio guard then blocks any stale access).
   */
  protected async logout(): Promise<void> {
    this.close();
    await this.auth.logout();
    this.entitlement.clear();
    await this.router.navigateByUrl('/');
  }
}
