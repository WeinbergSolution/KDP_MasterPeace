// Central, type-safe pricing configuration for the landing page. Final prices
// are not decided yet — every plan shows PRICE_PLACEHOLDER, and only real,
// currently shipping product features are listed (no invented prices, discounts,
// free trials or capabilities). The real differentiator is the number of
// included book productions. Swap priceLabel here once final.

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
  readonly billingLabel: string;
  readonly priceLabel: string;
  readonly highlighted: boolean;
  readonly highlightLabel?: string;
  readonly features: readonly string[];
  readonly ctaLabel: string;
}

/** Shown until final prices are decided (centrally swappable, kept subtle). */
export const PRICE_PLACEHOLDER = 'Preis folgt';

export const PLANS: readonly Plan[] = [
  {
    id: 'tester',
    name: 'Tester',
    audience: 'Zum Kennenlernen mit einem vollständigen Buch',
    books: '1',
    booksLabel: 'Buchproduktion',
    booksNote: 'einmalig',
    billingType: 'oneTime',
    billingLabel: 'Einmaliger Kauf',
    priceLabel: PRICE_PLACEHOLDER,
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
    billingLabel: 'Monatliches Abo',
    priceLabel: PRICE_PLACEHOLDER,
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
    billingLabel: 'Monatliches Abo',
    priceLabel: PRICE_PLACEHOLDER,
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
    billingLabel: 'Monatliches Abo',
    priceLabel: PRICE_PLACEHOLDER,
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

/** Honest interstitial shown to signed-in users (no payment integration yet). */
export const BOOKING_PENDING_NOTICE =
  'Die Tarifbuchung wird derzeit vorbereitet.';
