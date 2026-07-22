// Central, type-safe pricing configuration for the landing page. All amounts are
// stored in cents and mirror the server catalog (api/_lib/plan-catalog.mjs) 1:1,
// including the tiered annual discounts. A year is twelve monthly instalments;
// the annual price is that regular value minus the plan's discount. Display-only:
// the server catalog remains the authority for the priceCents / bookLimit written
// to an entitlement (the client never supplies prices).

export type BillingType = 'oneTime' | 'subscription';
export type BillingCycle = 'one_time' | 'monthly' | 'annual';

/** A display price (value + period label); the currency is shared. */
export interface PriceDisplay {
  readonly value: string;
  readonly period: string;
}

/** A single pricing plan (quota-based, real features only). Amounts in cents. */
export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly audience: string;
  readonly books: string;
  readonly booksLabel: string;
  readonly booksNote: string;
  readonly billingType: BillingType;
  readonly currency: string;
  readonly oneTimeCents?: number;
  readonly monthlyCents?: number;
  readonly annualCents?: number;
  readonly annualDiscountPercent?: number;
  readonly highlighted: boolean;
  readonly highlightLabel?: string;
  readonly features: readonly string[];
  readonly ctaLabel: string;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'tester',
    name: 'Tester',
    audience: 'Zum Kennenlernen mit einem vollständigen Buch',
    books: '1',
    booksLabel: 'Buchproduktion',
    booksNote: 'einmalig',
    billingType: 'oneTime',
    currency: '€',
    oneTimeCents: 990,
    highlighted: false,
    features: [
      'Geführter 8-Schritte-Workflow',
      'Schreiben und manuelle Bearbeitung',
      'Formatierung und Cover-Workflow',
      'Vorhandene Exportformate',
      'KDP-Paket und Veröffentlichungs-Checkliste',
      'Projektspeicherung',
    ],
    ctaLabel: '1 Buch testen',
  },
  {
    id: 'starter',
    name: 'Starter',
    audience: 'Für den Einstieg in die regelmäßige Buchproduktion',
    books: '5',
    booksLabel: 'Buchproduktionen',
    booksNote: 'pro Abrechnungszeitraum',
    billingType: 'subscription',
    currency: '€',
    monthlyCents: 2900,
    annualCents: 30624,
    annualDiscountPercent: 12,
    highlighted: false,
    features: [
      'Alles aus Tester',
      'Mehrere gespeicherte Buchprojekte',
      'Bestehende Projekte erneut bearbeiten',
      'Vorhandene Inhalte erneut exportieren',
    ],
    ctaLabel: 'Starter wählen',
  },
  {
    id: 'creator',
    name: 'Creator',
    audience: 'Für regelmäßige Selfpublisher',
    books: '12',
    booksLabel: 'Buchproduktionen',
    booksNote: 'pro Abrechnungszeitraum',
    billingType: 'subscription',
    currency: '€',
    monthlyCents: 5900,
    annualCents: 60180,
    annualDiscountPercent: 15,
    highlighted: true,
    highlightLabel: 'Beliebteste Wahl',
    features: [
      'Alles aus Starter',
      'Für regelmäßige Veröffentlichungen',
      'Mehr parallel gespeicherte Buchprojekte',
      'Vollständiger Workflow je Buchprojekt',
    ],
    ctaLabel: 'Creator wählen',
  },
  {
    id: 'pro',
    name: 'Pro',
    audience: 'Für ein größeres Veröffentlichungsvolumen',
    books: '25',
    booksLabel: 'Buchproduktionen',
    booksNote: 'pro Abrechnungszeitraum',
    billingType: 'subscription',
    currency: '€',
    monthlyCents: 9900,
    annualCents: 95040,
    annualDiscountPercent: 20,
    highlighted: false,
    features: [
      'Alles aus Creator',
      'Für umfangreichere Buchproduktion',
      'Höchste enthaltene Projektanzahl',
      'Vollständiger Workflow je Buchprojekt',
    ],
    ctaLabel: 'Pro wählen',
  },
];

/** Neutral note for the annual toggle (the real discount is shown per tier). */
export const ANNUAL_SAVING_NOTE = 'Jährliche Abrechnung – Rabatt je nach Tarif';

/**
 * Groups the integer part with German thousands separators (locale-independent).
 *
 * @param whole The whole-euro amount.
 * @returns The grouped string (e.g. 1188 → "1.188").
 */
function group(whole: number): string {
  return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formats a cent amount as a German euro value (no currency symbol). Whole euros
 * render without decimals; any cents render with a comma and two digits.
 *
 * @param cents The amount in cents.
 * @returns The formatted value, e.g. 30624 → "306,24", 2900 → "29".
 */
export function euro(cents: number): string {
  const abs = Math.abs(Math.round(cents));
  const rest = abs % 100;
  const whole = group(Math.floor(abs / 100));
  return rest === 0 ? whole : `${whole},${String(rest).padStart(2, '0')}`;
}

/**
 * Returns the display price for a plan at a billing cycle (Tester is one-time).
 *
 * @param plan The plan.
 * @param cycle The selected billing cycle.
 * @returns The display price.
 */
export function priceFor(plan: Plan, cycle: BillingCycle): PriceDisplay {
  if (plan.billingType === 'oneTime')
    return { value: euro(plan.oneTimeCents ?? 0), period: 'einmalig' };
  if (cycle === 'annual')
    return { value: euro(plan.annualCents ?? 0), period: '/ Jahr' };
  return { value: euro(plan.monthlyCents ?? 0), period: '/ Monat' };
}

/**
 * Returns the effective billing cycle for a plan (Tester is always one-time).
 *
 * @param plan The plan.
 * @param cycle The selected billing cycle.
 * @returns The effective billing cycle id.
 */
export function billingFor(plan: Plan, cycle: BillingCycle): BillingCycle {
  return plan.billingType === 'oneTime' ? 'one_time' : cycle;
}

/**
 * The computed monthly equivalent of the annual price, in cents (annual / 12).
 *
 * @param plan The plan.
 * @returns The per-month cent amount.
 */
export function annualPerMonthCents(plan: Plan): number {
  return Math.round((plan.annualCents ?? 0) / 12);
}

/**
 * The annual saving versus twelve monthly instalments, in cents.
 *
 * @param plan The plan.
 * @returns The saved cent amount (monthly × 12 − annual).
 */
export function annualSavingsCents(plan: Plan): number {
  return (plan.monthlyCents ?? 0) * 12 - (plan.annualCents ?? 0);
}

/**
 * The formatted monthly-equivalent value of the annual price.
 *
 * @param plan The plan.
 * @returns The German euro value, e.g. "50,15".
 */
export function monthlyEquivalent(plan: Plan): string {
  return euro(annualPerMonthCents(plan));
}

/**
 * The formatted annual saving versus monthly billing.
 *
 * @param plan The plan.
 * @returns The German euro value, e.g. "106,20".
 */
export function annualSavings(plan: Plan): string {
  return euro(annualSavingsCents(plan));
}
