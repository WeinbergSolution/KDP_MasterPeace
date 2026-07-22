// Central, type-safe pricing configuration for the landing page. Prices are
// preliminary launch prices, split into value / currency / period so the amount
// can read large with a smaller currency and billing note. Only real, currently
// shipping product features are listed (no invented discounts, annual prices,
// strike-throughs, VAT statements or free trials). Swap the values here.

export type BillingType = 'oneTime' | 'subscription';

/** A single pricing plan (quota-based, real features only). */
export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly audience: string;
  readonly books: string;
  readonly booksLabel: string;
  readonly booksNote: string;
  readonly billingType: BillingType;
  readonly priceValue: string;
  readonly priceCurrency: string;
  readonly pricePeriod: string;
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
    priceValue: '9,90',
    priceCurrency: '€',
    pricePeriod: 'einmalig',
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
    priceValue: '29',
    priceCurrency: '€',
    pricePeriod: '/ Monat',
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
    priceValue: '59',
    priceCurrency: '€',
    pricePeriod: '/ Monat',
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
    priceValue: '99',
    priceCurrency: '€',
    pricePeriod: '/ Monat',
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
