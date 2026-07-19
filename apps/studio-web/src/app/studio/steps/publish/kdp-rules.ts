// Central, versioned KDP limits + royalty parameters. These are changeable
// external facts, kept in ONE place with a rule version and source date rather
// than scattered/hardcoded across the UI. They are an orientation only and MUST
// be re-verified against official KDP sources before a public production release
// — the binding calculators are the KDP price tab and the KDP Print Previewer.

/** Versioned KDP rule set (orientation only — verify before production). */
export const KDP_RULES = {
  version: 1,
  sourceDate: '2026-07-19',
  source:
    'Amazon KDP Help (kdp.amazon.com) — verify against official KDP sources before a public release.',
  disclaimer:
    'Unverbindliche Schätzung/Orientierung — keine Steuer-, Finanz- oder Rechtsberatung, keine Garantie für Amazons aktuelle Oberfläche oder Prüfung. Verbindlich sind die offiziellen KDP-Rechner und der KDP-Previewer.',
  maxTitleSubtitleChars: 200,
  maxDescriptionChars: 4000,
  maxKeywordChars: 50,
  keywordCount: 7,
  emptyChapterWords: 30,
  minPages: { paperback: 24, hardcover: 75 } as Record<string, number>,
  maxPages: { paperback: 828, hardcover: 550 } as Record<string, number>,
  vatRate: 1.07,
  printRoyaltyRate: 0.6,
  ebook70Range: [2.99, 9.99] as const,
  ebookRoyalty70: 0.7,
  ebookRoyalty35: 0.35,
} as const;
