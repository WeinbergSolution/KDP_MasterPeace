// Pure access decisions for the route guards (unit-testable; no Angular/Firebase
// imports). Access to the studio is gated in three stages: signed in →
// e-mail verified → an active server-controlled entitlement. A plan-selection
// intent from a query parameter or the browser is NEVER an entitlement and never
// grants access. Verified users without an active entitlement are sent to the
// plan-selection page (they cannot enter the studio yet).

/** The auth-only gate (used by verified-only routes and public-only routes). */
export interface AuthGate {
  readonly authenticated: boolean;
  readonly emailVerified: boolean;
}

/** The full studio gate: auth + verification + an active entitlement. */
export interface StudioGate extends AuthGate {
  readonly entitlementActive: boolean;
}

/** Where a verified-only / public-only guard should send the user. */
export type GuardDecision = 'allow' | 'login' | 'verify-email' | 'studio';

/** Where the studio guard should send the user. */
export type StudioDecision = 'allow' | 'login' | 'verify-email' | 'choose-plan';

/**
 * Decides access to a route that only requires a verified account (e.g. the
 * plan-selection and checkout pages) — entitlement is deliberately not required.
 *
 * @param gate The current auth gate state.
 * @returns 'allow' for a verified signed-in user; otherwise the redirect target.
 */
export function protectedDecision(gate: AuthGate): GuardDecision {
  if (!gate.authenticated) return 'login';
  if (!gate.emailVerified) return 'verify-email';
  return 'allow';
}

/**
 * Decides access to the studio: signed in, verified AND an active entitlement.
 *
 * @param gate The current studio gate state.
 * @returns 'allow' only with an active entitlement; otherwise the redirect
 *   target (login / verify-email / choose-plan).
 */
export function studioDecision(gate: StudioGate): StudioDecision {
  if (!gate.authenticated) return 'login';
  if (!gate.emailVerified) return 'verify-email';
  if (!gate.entitlementActive) return 'choose-plan';
  return 'allow';
}

/**
 * Decides access to a public-only route (login/register/forgot-password).
 *
 * @param gate The current auth gate state.
 * @returns 'studio' for a verified signed-in user; otherwise 'allow'.
 */
export function guestDecision(gate: AuthGate): GuardDecision {
  return gate.authenticated && gate.emailVerified ? 'studio' : 'allow';
}
