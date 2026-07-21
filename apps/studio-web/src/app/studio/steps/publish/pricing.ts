// Non-binding royalty estimation for the price calculator (Step 8), ported 1:1
// from the Legacy V3 reference. All KDP numbers come from the central, versioned
// KDP_RULES — this is an orientation only, not financial/tax/legal advice, and
// the binding calculator is the one in the KDP price tab.

import { KDP_RULES } from './kdp-rules';

/** A single estimated pricing result set. */
export interface Pricing {
  readonly cost: number;
  readonly minPrice: number;
  readonly royalty: number;
  readonly eRoyalty: number;
  readonly e70: boolean;
}

/**
 * Estimates the black-and-white print cost (Amazon.de) for a page count.
 *
 * @param pages The interior page count.
 * @param binding The binding ('paperback' or 'hardcover').
 * @returns The estimated print cost in euros.
 */
export function estimatePrintCost(pages: number, binding: string): number {
  const p = Math.max(24, pages || 0);
  if (binding === 'hardcover') return p <= 108 ? 6.05 : 4.65 + 0.014 * p;
  return p <= 108 ? 1.93 : 0.6 + 0.012 * p;
}

/**
 * Computes the estimated royalties and minimum list price for a book.
 *
 * @param pages The interior page count.
 * @param binding The binding ('paperback' or 'hardcover').
 * @param price The print list price (gross, euros).
 * @param ebookPrice The e-book price (gross, euros).
 * @returns The estimated pricing results.
 */
export function computePricing(
  pages: number,
  binding: string,
  price: number,
  ebookPrice: number,
): Pricing {
  const cost = estimatePrintCost(pages, binding);
  const netto = price / KDP_RULES.vatRate;
  const royalty = KDP_RULES.printRoyaltyRate * netto - cost;
  const minPrice =
    Math.ceil((cost / KDP_RULES.printRoyaltyRate) * KDP_RULES.vatRate * 100) /
    100;
  const eNetto = ebookPrice / KDP_RULES.vatRate;
  const [lo, hi] = KDP_RULES.ebook70Range;
  const e70 = ebookPrice >= lo && ebookPrice <= hi;
  const rate = e70 ? KDP_RULES.ebookRoyalty70 : KDP_RULES.ebookRoyalty35;
  return { cost, minPrice, royalty, eRoyalty: rate * eNetto, e70 };
}
