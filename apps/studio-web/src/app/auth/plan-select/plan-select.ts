import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { allowedPlan } from '../plan';
import { savePlanIntent } from '../plan-intent';
import { PlanTiersComponent } from '../../landing/plan-tiers/plan-tiers';

/**
 * Plan-selection page (/tarif-waehlen). Shown to a signed-in, verified user who
 * has no active entitlement yet. Choosing a plan only records the intent and
 * moves to the honest checkout page — it never grants studio access. Reuses the
 * central pricing tiers (pricing-data.ts).
 */
@Component({
  selector: 'app-plan-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PlanTiersComponent],
  templateUrl: './plan-select.html',
  styleUrl: './plan-select.scss',
})
export class PlanSelectComponent {
  private readonly router = inject(Router);

  /**
   * Records the selection intent and routes to /checkout — grants nothing.
   *
   * @param raw The chosen plan id (re-validated against the allowlist).
   */
  protected async onChoose(raw: string): Promise<void> {
    const plan = allowedPlan(raw);
    if (!plan) return;
    savePlanIntent(plan);
    await this.router.navigateByUrl(`/checkout?plan=${plan}`);
  }
}
