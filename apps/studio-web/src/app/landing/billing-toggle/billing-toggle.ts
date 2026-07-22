import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ANNUAL_SAVING_NOTE, type BillingCycle } from '../pricing-data';

/** Monthly/annual billing toggle with an honest annual-saving note. */
@Component({
  selector: 'app-billing-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './billing-toggle.html',
  styleUrl: './billing-toggle.scss',
})
export class BillingToggleComponent {
  readonly cycle = input<BillingCycle>('monthly');
  readonly cycleChange = output<BillingCycle>();
  protected readonly note = ANNUAL_SAVING_NOTE;

  /**
   * Emits a new billing cycle.
   *
   * @param cycle The chosen cycle.
   */
  protected set(cycle: BillingCycle): void {
    this.cycleChange.emit(cycle);
  }
}
