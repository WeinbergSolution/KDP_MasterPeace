import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Check, LucideAngularModule } from 'lucide-angular';
import { PLANS } from '../pricing-data';

// Reusable presentation of the four (approved) pricing tiers from the central
// pricing-data.ts — used on the landing page and the plan-selection page. It
// only renders and emits the chosen plan id; the parent decides where to go
// (a selection is never an entitlement).

/** Renders the four pricing tiers and emits the chosen plan id. */
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

  /** Emits the chosen plan id (the parent re-validates and routes). */
  readonly choose = output<string>();
}
