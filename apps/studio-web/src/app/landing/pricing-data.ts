// Central, type-safe pricing configuration for the landing page. Prices are
// preliminary test-phase prices split into billing cycles (Tester is one-time;
// the paid plans are monthly or annual, where annual equals ten monthly
// instalments). Display-only: the server catalog (api/_lib/plan-catalog.mjs) is
// the authority for the actual priceCents / bookLimit written to an entitlement.

export type BillingType = 'oneTime' | 'subscription';
export type BillingCycle = 'one_time' | 'monthly' | 'annual';

/** A display price (value + period label); the currency is shared. */
export interface PriceDisplay {
  readonly value: string;
  readonly period: string;
}

/** A single pricing plan (quota-based, real features only). */
export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly audience: string;
  readonly books: string;
  readonly booksLabel: string;
  readonly booksNote: string;
  readonly billingType: BillingType;
  readonly currency: string;
  readonly prices: Partial<Record<BillingCycle, PriceDisplay>>;
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
    prices: { one_time: { value: '9,90', period: 'einmalig' } },
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
    prices: {
      monthly: { value: '29', period: '/ Monat' },
      annual: { value: '290', period: '/ Jahr' },
    },
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
    prices: {
      monthly: { value: '59', period: '/ Monat' },
      annual: { value: '590', period: '/ Jahr' },
    },
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
    prices: {
      monthly: { value: '99', period: '/ Monat' },
      annual: { value: '990', period: '/ Jahr' },
    },
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

/** Note shown on the annual option / when annual is selected. */
export const ANNUAL_SAVING_NOTE = 'Jährlich zahlen · 2 Monatsbeiträge sparen';

/**
 * Returns the display price for a plan at a billing cycle, falling back to the
 * plan's available price (Tester is always one-time).
 *
 * @param plan The plan.
 * @param cycle The selected billing cycle.
 * @returns The display price.
 */
export function priceFor(plan: Plan, cycle: BillingCycle): PriceDisplay {
  return (
    plan.prices[cycle] ??
    plan.prices.one_time ??
    plan.prices.monthly ?? { value: '', period: '' }
  );
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
