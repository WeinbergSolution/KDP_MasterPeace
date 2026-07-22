// Pure helpers for the e-mail verification flow (no Angular/Firebase imports, so
// they are unit-testable). They build the continue URL for the verification
// e-mail and validate the incoming Firebase e-mail-action parameters. No open
// redirects: navigation always targets our own /login, and the plan/billing are
// only read from a same-origin continue URL and only when allowlisted.

import {
  allowedBilling,
  allowedPlan,
  type BillingId,
  type PlanId,
} from './plan';

/**
 * Builds the continue URL embedded in the verification e-mail.
 *
 * @param origin The app origin (window.location.origin).
 * @param plan The allowlisted plan id, or null.
 * @param billing The allowlisted billing cycle, or null.
 * @returns A same-origin /login URL carrying the verified flag + plan/billing.
 */
export function verificationContinueUrl(
  origin: string,
  plan: PlanId | null,
  billing: BillingId | null = null,
): string {
  return `${origin}${loginPath(plan, billing)}`;
}

/**
 * Builds our own /login path with the verified flag and any plan/billing.
 *
 * @param plan The allowlisted plan id, or null.
 * @param billing The allowlisted billing cycle, or null.
 * @returns The relative /login path.
 */
function loginPath(plan: PlanId | null, billing: BillingId | null): string {
  const params = new URLSearchParams({ verified: '1' });
  if (plan) params.set('plan', plan);
  if (billing) params.set('billing', billing);
  return `/login?${params.toString()}`;
}

/** The validated result of a Firebase e-mail action. */
export interface VerifyAction {
  readonly valid: boolean;
  readonly oobCode: string;
  readonly plan: PlanId | null;
  readonly loginTarget: string;
}

/**
 * Reads allowlisted plan/billing from a same-origin continue URL.
 *
 * @param continueUrl The continueUrl parameter (untrusted).
 * @param origin The app origin.
 * @returns The plan + billing (nulls when missing/foreign/not allowlisted).
 */
function paramsFromContinue(
  continueUrl: string,
  origin: string,
): { plan: PlanId | null; billing: BillingId | null } {
  try {
    const url = new URL(continueUrl, origin);
    if (url.origin !== origin) return { plan: null, billing: null };
    return {
      plan: allowedPlan(url.searchParams.get('plan')),
      billing: allowedBilling(url.searchParams.get('billing')),
    };
  } catch {
    return { plan: null, billing: null };
  }
}

/**
 * Validates Firebase e-mail-action parameters for the verifyEmail flow.
 *
 * @param get A getter for a query parameter by name.
 * @param origin The app origin.
 * @returns The validated action; loginTarget is always our own /login path.
 */
export function parseVerifyAction(
  get: (key: string) => string | null,
  origin: string,
): VerifyAction {
  const oobCode = get('oobCode') ?? '';
  const { plan, billing } = paramsFromContinue(
    get('continueUrl') ?? '',
    origin,
  );
  return {
    valid: get('mode') === 'verifyEmail' && oobCode.length > 0,
    oobCode,
    plan,
    loginTarget: loginPath(plan, billing),
  };
}
