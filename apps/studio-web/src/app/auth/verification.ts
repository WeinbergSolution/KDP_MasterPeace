// Pure helpers for the e-mail verification flow (no Angular/Firebase imports, so
// they are unit-testable). They build the continue URL for the verification
// e-mail and validate the incoming Firebase e-mail-action parameters. No open
// redirects: navigation always targets our own /login, and the plan id is only
// read from a same-origin continue URL and only when it is on the allowlist.

import { allowedPlan, type PlanId } from './plan';

/**
 * Builds the continue URL embedded in the verification e-mail.
 *
 * @param origin The app origin (window.location.origin).
 * @param plan The allowlisted plan id, or null.
 * @returns A same-origin /login URL carrying the verified flag and plan.
 */
export function verificationContinueUrl(
  origin: string,
  plan: PlanId | null,
): string {
  const base = `${origin}/login?verified=1`;
  return plan ? `${base}&plan=${plan}` : base;
}

/** The validated result of a Firebase e-mail action. */
export interface VerifyAction {
  readonly valid: boolean;
  readonly oobCode: string;
  readonly plan: PlanId | null;
  readonly loginTarget: string;
}

/**
 * Reads an allowlisted plan id from a same-origin continue URL.
 *
 * @param continueUrl The continueUrl parameter (untrusted).
 * @param origin The app origin.
 * @returns The plan id, or null when missing/foreign/not allowlisted.
 */
function planFromContinue(continueUrl: string, origin: string): PlanId | null {
  try {
    const url = new URL(continueUrl, origin);
    return url.origin === origin
      ? allowedPlan(url.searchParams.get('plan'))
      : null;
  } catch {
    return null;
  }
}

/**
 * Validates Firebase e-mail-action parameters for the verifyEmail flow.
 *
 * @param get A getter for a query parameter by name.
 * @param origin The app origin.
 * @returns The validated action (only mode===verifyEmail with an oobCode is
 *   valid); loginTarget is always our own relative /login path.
 */
export function parseVerifyAction(
  get: (key: string) => string | null,
  origin: string,
): VerifyAction {
  const oobCode = get('oobCode') ?? '';
  const plan = planFromContinue(get('continueUrl') ?? '', origin);
  const loginTarget = plan
    ? `/login?verified=1&plan=${plan}`
    : '/login?verified=1';
  return {
    valid: get('mode') === 'verifyEmail' && oobCode.length > 0,
    oobCode,
    plan,
    loginTarget,
  };
}
