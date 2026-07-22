// Server-authoritative plan catalog for the test phase. Prices are in cents. A
// year is twelve monthly instalments; the annual price is that regular value
// minus the plan's tiered discount (Starter 12 %, Creator 15 %, Pro 20 %). This
// is the source of truth for the entitlement's priceCents / bookLimit — the
// client never supplies them. Only the combinations declared here are valid
// (Tester is one-time only; the paid plans are monthly or annual).

export const PLAN_CATALOG = {
  tester: { bookLimit: 1, cycles: { one_time: 990 } },
  starter: {
    bookLimit: 5,
    annualDiscountPercent: 12,
    cycles: { monthly: 2900, annual: 30624 },
  },
  creator: {
    bookLimit: 12,
    annualDiscountPercent: 15,
    cycles: { monthly: 5900, annual: 60180 },
  },
  pro: {
    bookLimit: 25,
    annualDiscountPercent: 20,
    cycles: { monthly: 9900, annual: 95040 },
  },
};

export const PLAN_IDS = Object.keys(PLAN_CATALOG);
export const BILLING_CYCLES = ['one_time', 'monthly', 'annual'];

/**
 * Resolves a valid plan + billing combination to its server-derived values.
 *
 * @param {unknown} planId The requested plan id.
 * @param {unknown} billingCycle The requested billing cycle.
 * @returns {{planId: string, billingCycle: string, priceCents: number,
 *   bookLimit: number} | null} The resolved activation, or null when invalid.
 */
export function resolveActivation(planId, billingCycle) {
  const plan = typeof planId === 'string' ? PLAN_CATALOG[planId] : undefined;
  if (!plan) return null;
  const priceCents =
    typeof billingCycle === 'string' ? plan.cycles[billingCycle] : undefined;
  if (typeof priceCents !== 'number') return null;
  return { planId, billingCycle, priceCents, bookLimit: plan.bookLimit };
}
