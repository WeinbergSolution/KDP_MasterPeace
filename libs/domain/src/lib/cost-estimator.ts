// Provider cost estimation (target-architecture.md §7). Replaces the legacy
// prototype's complete absence of cost control (finding N06): every paid step
// gets a min/expected/max estimate before confirmation.

/** Token estimate for a single generation step (P50/P90 output bands). */
export interface StepTokenEstimate {
  readonly inputTokens: number;
  readonly outputTokensP50: number;
  readonly outputTokensP90: number;
}

/** Model pricing in cents per million tokens (from the versioned ModelCatalog). */
export interface ModelPricing {
  readonly inputPricePerMTokCents: number;
  readonly outputPricePerMTokCents: number;
}

/** Min/expected/max cost band for a step, in cents. */
export interface CostEstimateCents {
  readonly minCents: number;
  readonly expectedCents: number;
  readonly maxCents: number;
}

const TOKENS_PER_MILLION = 1_000_000;

/**
 * Converts a token count to cost in cents at a given per-million-token price.
 *
 * @param tokens The token count.
 * @param pricePerMTokCents Price in cents per million tokens.
 * @returns The cost in cents (unrounded).
 */
function tokenCostCents(tokens: number, pricePerMTokCents: number): number {
  return (tokens / TOKENS_PER_MILLION) * pricePerMTokCents;
}

/**
 * Estimates the min/expected/max cost of a generation step. The minimum assumes
 * minimal output (input only); expected uses the P50 and maximum the P90 output
 * band, so budgets and the hard-stop can be enforced before execution.
 *
 * @param tokens The step's token estimate.
 * @param pricing The model's current pricing.
 * @returns The min/expected/max cost band in cents.
 * @throws If any token or price value is negative.
 */
export function estimateStepCostCents(
  tokens: StepTokenEstimate,
  pricing: ModelPricing,
): CostEstimateCents {
  assertNonNegative(tokens, pricing);
  const input = tokenCostCents(
    tokens.inputTokens,
    pricing.inputPricePerMTokCents,
  );
  const out = (t: number) => tokenCostCents(t, pricing.outputPricePerMTokCents);
  return {
    minCents: input,
    expectedCents: input + out(tokens.outputTokensP50),
    maxCents: input + out(tokens.outputTokensP90),
  };
}

/**
 * Validates that all token and price inputs are non-negative.
 *
 * @param tokens The step's token estimate.
 * @param pricing The model's pricing.
 * @throws If any value is negative.
 */
function assertNonNegative(
  tokens: StepTokenEstimate,
  pricing: ModelPricing,
): void {
  const values = [
    tokens.inputTokens,
    tokens.outputTokensP50,
    tokens.outputTokensP90,
    pricing.inputPricePerMTokCents,
    pricing.outputPricePerMTokCents,
  ];
  if (values.some((v) => v < 0))
    throw new Error('token and price values must be >= 0');
}
