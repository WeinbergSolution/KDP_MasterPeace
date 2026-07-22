import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/firebase/auth.service';
import { EntitlementService } from '../../core/firebase/entitlement.service';
import { PLANS, type BillingCycle, priceFor } from '../../landing/pricing-data';

const PLAN_LABELS: Record<string, string> = {
  tester: 'Tester',
  starter: 'Starter',
  creator: 'Creator',
  pro: 'Pro',
};

/**
 * Account area (/konto). Shows profile (name, e-mail, verification), the active
 * test plan (name, billing, price, quota, honest test-phase note) with links to
 * the studio / plan change, and sign-out. No passwords or raw Firebase data.
 */
@Component({
  selector: 'app-konto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './konto.html',
  styleUrl: './konto.scss',
})
export class KontoComponent {
  private readonly auth = inject(AuthService);
  private readonly entitlement = inject(EntitlementService);
  private readonly router = inject(Router);

  protected readonly name = this.auth.displayName;
  protected readonly verified = this.auth.isEmailVerified;
  protected readonly active = this.entitlement.isActive;
  protected readonly ent = this.entitlement.entitlement;
  protected readonly email = computed(
    () => this.auth.currentUser()?.email ?? '',
  );

  constructor() {
    effect(() => {
      if (this.auth.isReady() && this.auth.isAuthenticated())
        void this.entitlement.refresh();
    });
  }

  /** The active plan's display label. */
  protected planLabel(): string {
    return PLAN_LABELS[this.ent()?.planId ?? ''] ?? '';
  }

  /** The active plan's price line for its billing cycle. */
  protected priceLine(): string {
    const entitlement = this.ent();
    const plan = PLANS.find((p) => p.id === entitlement?.planId);
    if (!plan) return '';
    const price = priceFor(
      plan,
      (entitlement?.billingCycle ?? 'monthly') as BillingCycle,
    );
    return `${price.value} ${plan.currency} ${price.period}`;
  }

  /** The active plan's book quota line. */
  protected quotaLine(): string {
    const plan = PLANS.find((p) => p.id === this.ent()?.planId);
    return plan ? `${plan.books} ${plan.booksLabel}` : '';
  }

  /** Human-readable billing type of the active plan. */
  protected billingText(): string {
    const cycle = this.ent()?.billingCycle;
    if (cycle === 'one_time') return 'Einmaliger Kauf';
    return cycle === 'annual' ? 'Jährliche Zahlung' : 'Monatliche Zahlung';
  }

  /** Signs out, clears the entitlement and returns to the landing page. */
  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.entitlement.clear();
    await this.router.navigateByUrl('/');
  }
}
