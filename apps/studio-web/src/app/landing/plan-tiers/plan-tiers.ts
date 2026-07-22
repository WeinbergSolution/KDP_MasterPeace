import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Check, LucideAngularModule } from 'lucide-angular';
import {
  PLANS,
  type BillingCycle,
  type Plan,
  type PriceDisplay,
  billingFor,
  priceFor,
} from '../pricing-data';

// Reusable presentation of the four (approved) pricing tiers from the central
// pricing-data.ts — used on the landing page and the plan-selection page. The
// displayed price follows the selected billing cycle; it only renders and emits
// the chosen plan + billing (a selection is never an entitlement).

/** A plan chosen from the tiers, with its effective billing cycle. */
export interface PlanChoice {
  readonly planId: string;
  readonly billing: BillingCycle;
}

/** Renders the four pricing tiers and emits the chosen plan + billing. */
@Component({
  selector: 'app-plan-tiers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './plan-tiers.html',
  styleUrl: './plan-tiers.scss',
})
export class PlanTiersComponent {
  protected readonly plans = PLANS;
  protected readonly checkIcon = Check;
  readonly cycle = input<BillingCycle>('monthly');
  readonly choose = output<PlanChoice>();

  /**
   * The display price for a plan at the current cycle.
   *
   * @param plan The plan.
   * @returns The display price.
   */
  protected price(plan: Plan): PriceDisplay {
    return priceFor(plan, this.cycle());
  }

  /**
   * Emits the chosen plan with its effective billing cycle.
   *
   * @param plan The chosen plan.
   */
  protected select(plan: Plan): void {
    this.choose.emit({
      planId: plan.id,
      billing: billingFor(plan, this.cycle()),
    });
  }
}
