// Pure access decisions for the route guards (unit-testable; no Angular/Firebase
// imports). A protected route requires a signed-in user whose e-mail is
// verified; a public-only route sends verified users to the studio. This package
// does NOT implement a paid-subscription check — a verified account still gains
// access via the existing flow. No fake subscription check is added.

/** The current authentication gate state. */
export interface AuthGate {
  readonly authenticated: boolean;
  readonly emailVerified: boolean;
}

/** Where a guard should send the user. */
export type GuardDecision = 'allow' | 'login' | 'verify-email' | 'studio';

/**
 * Decides access to a protected (studio) route.
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
 * Decides access to a public-only route (login/register/forgot-password).
 *
 * @param gate The current auth gate state.
 * @returns 'studio' for a verified signed-in user; otherwise 'allow'.
 */
export function guestDecision(gate: AuthGate): GuardDecision {
  return gate.authenticated && gate.emailVerified ? 'studio' : 'allow';
}
