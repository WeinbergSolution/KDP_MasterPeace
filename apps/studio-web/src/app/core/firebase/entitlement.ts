// Pure entitlement helpers (no Angular/Firebase imports). An entitlement is the
// server-controlled access grant that a later Stripe work package will set. The
// client may only READ it — never write it — and only 'active'/'trialing' grant
// studio access. Every other or missing status means no access. A plan-selection
// intent is NOT an entitlement and never grants access.

export const ACTIVE_ENTITLEMENT_STATES = ['active', 'trialing'] as const;

/**
 * Reports whether an entitlement status grants studio access.
 *
 * @param status The raw entitlement status (may be missing/unknown).
 * @returns True only for 'active' or 'trialing'.
 */
export function isActiveEntitlement(
  status: string | null | undefined,
): boolean {
  return (
    typeof status === 'string' &&
    (ACTIVE_ENTITLEMENT_STATES as readonly string[]).includes(status)
  );
}
