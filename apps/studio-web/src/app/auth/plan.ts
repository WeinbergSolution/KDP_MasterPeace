// Allowlist for the pricing plan-selection intent carried through the auth flow.
// A plan id is ONLY a selection intent — never proof of purchase, payment, an
// active subscription, a studio entitlement or a book quota. Any value outside
// the allowlist is discarded.

export const ALLOWED_PLANS = ['tester', 'starter', 'creator', 'pro'] as const;
export type PlanId = (typeof ALLOWED_PLANS)[number];

export const ALLOWED_BILLING = ['one_time', 'monthly', 'annual'] as const;
export type BillingId = (typeof ALLOWED_BILLING)[number];

/**
 * Returns the value when it is an allowed plan id, otherwise null.
 *
 * @param value The raw, untrusted query-parameter value.
 * @returns The allowlisted plan id, or null.
 */
export function allowedPlan(value: string | null | undefined): PlanId | null {
  return typeof value === 'string' &&
    (ALLOWED_PLANS as readonly string[]).includes(value)
    ? (value as PlanId)
    : null;
}

/**
 * Returns the value when it is an allowed billing cycle, otherwise null.
 *
 * @param value The raw, untrusted query-parameter value.
 * @returns The allowlisted billing cycle, or null.
 */
export function allowedBilling(
  value: string | null | undefined,
): BillingId | null {
  return typeof value === 'string' &&
    (ALLOWED_BILLING as readonly string[]).includes(value)
    ? (value as BillingId)
    : null;
}
