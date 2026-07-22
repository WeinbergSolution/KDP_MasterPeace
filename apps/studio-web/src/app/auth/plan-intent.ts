import { allowedPlan, type PlanId } from './plan';

// The plan-selection *intent* — a purely local, user-changeable UI preference so
// the plan the user picked can be pre-selected later. It is NEVER an entitlement
// and never grants access; guards ignore it entirely. Only allowlisted ids are
// stored/returned.

const KEY = 'kdp.planIntent';

/**
 * Persists the chosen plan as a local selection intent.
 *
 * @param planId An allowlisted plan id.
 */
export function savePlanIntent(planId: PlanId): void {
  try {
    localStorage.setItem(KEY, planId);
  } catch {
    /* storage unavailable (private mode) — intent is optional */
  }
}

/**
 * Reads the stored plan intent, if any (allowlisted only).
 *
 * @returns The allowlisted plan id, or null.
 */
export function readPlanIntent(): PlanId | null {
  try {
    return allowedPlan(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}
