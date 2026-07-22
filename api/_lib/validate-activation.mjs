import { resolveActivation } from './plan-catalog.mjs';

// Pure request-evaluation for the test-plan activation endpoint (no network, no
// Admin SDK — unit-testable). It never trusts the request body for uid, e-mail
// verification, prices or entitlements: those come from the verified ID token
// and the server catalog. The whole feature is gated by ENABLE_TEST_PHASE_PLANS.

/**
 * Evaluates an activation request against the method, auth, verification, the
 * test-phase flag and the plan/billing allowlists.
 *
 * @param {object} input The evaluated request facts.
 * @param {string} input.method The HTTP method.
 * @param {boolean} input.authenticated Whether a valid ID token was verified.
 * @param {boolean} input.emailVerified Whether the token's e-mail is verified.
 * @param {boolean} input.testPhaseEnabled Whether ENABLE_TEST_PHASE_PLANS is on.
 * @param {unknown} input.planId The requested plan id (from the body).
 * @param {unknown} input.billingCycle The requested billing cycle (from body).
 * @returns {{error: {code: number, message: string}} | {activation: object}}
 */
export function evaluateActivation(input) {
  const {
    method,
    authenticated,
    emailVerified,
    testPhaseEnabled,
    planId,
    billingCycle,
  } = input;
  if (method !== 'POST') return fail(405, 'Method Not Allowed');
  if (!testPhaseEnabled) return fail(403, 'Testphase ist nicht aktiviert.');
  if (!authenticated) return fail(401, 'Nicht angemeldet.');
  if (!emailVerified)
    return fail(403, 'Bitte bestätige zuerst deine E-Mail-Adresse.');
  const activation = resolveActivation(planId, billingCycle);
  if (!activation)
    return fail(400, 'Ungültige Tarif- oder Abrechnungsauswahl.');
  return { activation };
}

/**
 * Builds an error result.
 *
 * @param {number} code The HTTP status code.
 * @param {string} message The user-facing message.
 * @returns {{error: {code: number, message: string}}}
 */
function fail(code, message) {
  return { error: { code, message } };
}
