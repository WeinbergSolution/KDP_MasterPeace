import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivationService } from '../../core/firebase/activation.service';
import { allowedPlan } from '../plan';
import {
  PLANS,
  type BillingCycle,
  type Plan,
  billingFor,
  priceFor,
} from '../../landing/pricing-data';

const CYCLES: BillingCycle[] = ['one_time', 'monthly', 'annual'];

/**
 * Checkout summary for the test phase. The user reviews plan, billing and quota,
 * may change them, must tick a confirmation checkbox, and only then activates a
 * TEST plan via the server. It states clearly that no payment is taken; it shows
 * no card form, no fake payment/confirmation and no direct studio path.
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activation = inject(ActivationService);

  protected readonly plan = this.resolvePlan();
  protected readonly cycle = this.resolveCycle();
  protected confirmed = false;
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  /** Resolves the selected plan from an allowlisted query parameter. */
  private resolvePlan(): Plan | null {
    const id = allowedPlan(this.route.snapshot.queryParamMap.get('plan'));
    return id ? (PLANS.find((p) => p.id === id) ?? null) : null;
  }

  /** Resolves the billing cycle (Tester is always one-time). */
  private resolveCycle(): BillingCycle {
    const raw = this.route.snapshot.queryParamMap.get('billing') ?? '';
    const plan = this.resolvePlan();
    if (plan?.billingType === 'oneTime') return 'one_time';
    return CYCLES.includes(raw as BillingCycle) && raw !== 'one_time'
      ? (raw as BillingCycle)
      : 'monthly';
  }

  /** The display price for the selected plan + cycle. */
  protected get price() {
    return this.plan ? priceFor(this.plan, this.cycle) : null;
  }

  /** Human-readable billing type. */
  protected get billingText(): string {
    if (this.cycle === 'one_time') return 'Einmaliger Kauf';
    return this.cycle === 'annual' ? 'Jährliche Zahlung' : 'Monatliche Zahlung';
  }

  /** Whether the annual cycle is selected. */
  protected get isAnnual(): boolean {
    return this.cycle === 'annual';
  }

  /** Switches a subscription plan between monthly and annual billing. */
  protected changeBilling(): void {
    if (!this.plan || this.plan.billingType === 'oneTime') return;
    const next = this.cycle === 'annual' ? 'monthly' : 'annual';
    void this.router.navigate([], {
      queryParams: { plan: this.plan.id, billing: next },
    });
  }

  /** Activates the selected TEST plan via the server, then opens the studio. */
  protected async activate(): Promise<void> {
    if (!this.plan || !this.confirmed || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.activation.activateTestPlan(
        this.plan.id,
        billingFor(this.plan, this.cycle),
      );
      await this.router.navigateByUrl('/studio');
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
