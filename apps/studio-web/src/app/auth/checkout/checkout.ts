import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { allowedPlan } from '../plan';
import { PLANS, type Plan } from '../../landing/pricing-data';

/**
 * Honest transitional checkout page. Stripe is not implemented in this work
 * package, so it only summarises the selected plan and states that access
 * follows a confirmed payment. It shows no card form, no fake payment, no
 * confirmation and no path into the studio — a selection is never a payment.
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly plan = this.resolvePlan();

  /** Resolves the selected plan from an allowlisted query parameter. */
  private resolvePlan(): Plan | null {
    const id = allowedPlan(this.route.snapshot.queryParamMap.get('plan'));
    return id ? (PLANS.find((p) => p.id === id) ?? null) : null;
  }

  /** Human-readable billing type for the selected plan. */
  protected get billingText(): string {
    return this.plan?.billingType === 'oneTime'
      ? 'Einmaliger Kauf'
      : 'Monatliches Abo';
  }
}
