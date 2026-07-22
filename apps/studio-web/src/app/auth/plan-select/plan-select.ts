import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { allowedPlan } from '../plan';
import { savePlanIntent } from '../plan-intent';
import type { BillingCycle } from '../../landing/pricing-data';
import {
  PlanTiersComponent,
  type PlanChoice,
} from '../../landing/plan-tiers/plan-tiers';
import { BillingToggleComponent } from '../../landing/billing-toggle/billing-toggle';

/**
 * Plan-selection page (/tarif-waehlen). Shown to a signed-in, verified user who
 * has no active entitlement yet (or who wants to change plan). Choosing a plan
 * only records the intent and moves to the checkout summary — it never grants
 * access. Reuses the central pricing tiers + billing toggle.
 */
@Component({
  selector: 'app-plan-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PlanTiersComponent, BillingToggleComponent],
  templateUrl: './plan-select.html',
  styleUrl: './plan-select.scss',
})
export class PlanSelectComponent {
  private readonly router = inject(Router);
  protected readonly cycle = signal<BillingCycle>('monthly');

  /**
   * Records the intent and routes to /checkout with plan + billing.
   *
   * @param choice The chosen plan + billing (re-validated).
   */
  protected async onChoose(choice: PlanChoice): Promise<void> {
    const plan = allowedPlan(choice.planId);
    if (!plan) return;
    savePlanIntent(plan);
    await this.router.navigateByUrl(
      `/checkout?plan=${plan}&billing=${choice.billing}`,
    );
  }
}
