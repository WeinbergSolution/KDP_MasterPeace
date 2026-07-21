// Central, type-safe pricing configuration for the landing page. Prices and AI
// credit amounts are NOT yet decided — every plan shows PRICE_PLACEHOLDER and
// only qualitative, real product features are listed (no invented prices,
// tokens, discounts or capabilities). Swap priceLabel / aiCreditLabel here once
// final values exist; the UI needs no change.

export type BillingType = 'oneTime' | 'subscription';

/** A single pricing plan (quota-based, real features only). */
export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly billingType: BillingType;
  readonly billingLabel: string;
  readonly priceLabel: string;
  readonly bookLimit: string;
  readonly aiCreditLabel: string;
  readonly highlighted: boolean;
  readonly highlightLabel?: string;
  readonly features: readonly string[];
  readonly ctaLabel: string;
}

/** Shown until final prices are decided (centrally swappable). */
export const PRICE_PLACEHOLDER = 'Preis wird vor Verkaufsstart bekannt gegeben';

export const PLANS: readonly Plan[] = [
  {
    id: 'tester',
    name: 'Tester',
    billingType: 'oneTime',
    billingLabel: 'Einmaliger Kauf · kein Abo',
    priceLabel: PRICE_PLACEHOLDER,
    bookLimit: '1 Buchproduktion',
    aiCreditLabel: 'Begrenztes KI-Guthaben',
    highlighted: false,
    features: [
      'Vollständiger 8-Schritte-Workflow',
      'Ideen- und Gliederungsbereich',
      'Schreibbereich',
      'Formatierungsbereich',
      'Cover-Workflow',
      'Vorhandene Exportfunktionen',
      'KDP-Paket',
      'Veröffentlichungs-Checkliste',
      'Automatische Projektspeicherung',
      'Manuelle Bearbeitung ohne zusätzlichen KI-Verbrauch',
    ],
    ctaLabel: '1 Buch testen',
  },
  {
    id: 'starter',
    name: 'Starter',
    billingType: 'subscription',
    billingLabel: 'Monatliches Abo',
    priceLabel: PRICE_PLACEHOLDER,
    bookLimit: 'Bis zu 5 Buchproduktionen pro Abrechnungszeitraum',
    aiCreditLabel: 'Monatliches KI-Guthaben für bis zu 5 Buchproduktionen',
    highlighted: false,
    features: [
      'Alles aus Tester',
      'Mehrere gespeicherte Buchprojekte',
      'Erneute manuelle Bearbeitung bestehender Projekte',
      'Erneute Exporte bestehender Inhalte',
    ],
    ctaLabel: 'Starter wählen',
  },
  {
    id: 'creator',
    name: 'Creator',
    billingType: 'subscription',
    billingLabel: 'Monatliches Abo',
    priceLabel: PRICE_PLACEHOLDER,
    bookLimit: 'Bis zu 12 Buchproduktionen pro Abrechnungszeitraum',
    aiCreditLabel: 'Größeres monatliches KI-Guthaben',
    highlighted: true,
    highlightLabel: 'Beliebteste Wahl',
    features: [
      'Alles aus Starter',
      'Mehr KI-gestützte Generierungen und Überarbeitungen',
      'Manuelle Weiterbearbeitung bereits erstellter Inhalte',
    ],
    ctaLabel: 'Creator wählen',
  },
  {
    id: 'pro',
    name: 'Pro',
    billingType: 'subscription',
    billingLabel: 'Monatliches Abo',
    priceLabel: PRICE_PLACEHOLDER,
    bookLimit: 'Bis zu 25 Buchproduktionen pro Abrechnungszeitraum',
    aiCreditLabel: 'Höchstes monatliches KI-Guthaben',
    highlighted: false,
    features: [
      'Alles aus Creator',
      'Größeres Kontingent für umfangreiche Buchproduktionen',
      'Manuelle Weiterbearbeitung und erneute Exporte',
    ],
    ctaLabel: 'Pro wählen',
  },
];

/** Plain-language rules on what does / doesn't consume AI credit. */
export const AI_CREDIT_RULES: readonly string[] = [
  'KI-Aktionen verbrauchen KI-Guthaben.',
  'Manuelles Schreiben und Bearbeiten verbraucht kein KI-Guthaben.',
  'Navigation, Speicherung und das Öffnen bestehender Projekte verbrauchen kein KI-Guthaben.',
  'Ein erneuter Export unveränderter Inhalte verbraucht kein KI-Guthaben.',
  'Eine neue KI-Generierung, Erweiterung oder Neufassung verbraucht Guthaben.',
  'Bei aufgebrauchtem Guthaben bleiben Projekte und manuelle Bearbeitung weiterhin erreichbar.',
  'Neue KI-Aktionen sind dann erst nach neuem Guthaben oder im nächsten Abrechnungszeitraum möglich.',
];

/** Honest interstitial shown to signed-in users (no payment integration yet). */
export const BOOKING_PENDING_NOTICE =
  'Die Tarifbuchung wird derzeit vorbereitet.';
