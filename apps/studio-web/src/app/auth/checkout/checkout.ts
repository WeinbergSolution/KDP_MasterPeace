import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivationService } from '../../core/firebase/activation.service';
import { EntitlementService } from '../../core/firebase/entitlement.service';
import { allowedPlan } from '../plan';
import {
  PLANS,
  type BillingCycle,
  type Plan,
  annualSavings,
  billingFor,
  monthlyEquivalent,
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
  private readonly entitlement = inject(EntitlementService);

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

  /** The annual discount percentage for the selected plan. */
  protected get discountPercent(): number {
    return this.plan?.annualDiscountPercent ?? 0;
  }

  /** The annual saving line for the selected plan (e.g. "106,20 € pro Jahr"). */
  protected get savingsLine(): string {
    return this.plan
      ? `${annualSavings(this.plan)} ${this.plan.currency} pro Jahr`
      : '';
  }

  /** The monthly-equivalent line (e.g. "50,15 € pro Monat"). */
  protected get monthlyEquivLine(): string {
    return this.plan
      ? `${monthlyEquivalent(this.plan)} ${this.plan.currency} pro Monat`
      : '';
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
      await this.openStudio();
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Navigates to the studio only after the entitlement is confirmed readable and
   * active; otherwise surfaces the read problem instead of a silent redirect.
   * ActivationService.activateTestPlan already refreshed the entitlement.
   */
  private async openStudio(): Promise<void> {
    if (this.entitlement.isActive()) {
      await this.router.navigateByUrl('/studio');
      return;
    }
    this.error.set(
      this.entitlement.readError()
        ? 'Dein Testtarif wurde gespeichert, konnte aber noch nicht gelesen werden. Bitte lade die Seite neu — bleibt der Fehler, muss der Firestore-Leserechte-Regel für dein Entitlement veröffentlicht werden.'
        : 'Dein Testtarif wurde gespeichert. Öffne „Mein Konto“ oder lade die Seite neu, um fortzufahren.',
    );
  }
}
