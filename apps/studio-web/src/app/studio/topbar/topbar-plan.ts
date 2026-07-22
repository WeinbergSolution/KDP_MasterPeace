// Pure, display-only helpers for the studio topbar. Plan names come from the
// shared landing catalog (PLANS) — the studio never re-hardcodes tariff data.

import { PLANS } from '../../landing/pricing-data';

const CYCLE_WORDS: Record<string, string> = {
  monthly: 'monatlich',
  annual: 'jährlich',
};

/**
 * The plan's display name from the shared catalog.
 *
 * @param planId The entitlement's plan id.
 * @returns The plan name (e.g. "Creator"), or '' when unknown.
 */
export function planName(planId?: string): string {
  return PLANS.find((plan) => plan.id === planId)?.name ?? '';
}

/**
 * A compact plan line for the header, e.g. "Creator · jährlich" or "Tester".
 *
 * @param planId The entitlement's plan id.
 * @param cycle The billing cycle (one_time / monthly / annual).
 * @returns The formatted line, or '' when the plan is unknown.
 */
export function planLineText(planId?: string, cycle?: string): string {
  const name = planName(planId);
  const word = CYCLE_WORDS[cycle ?? ''];
  return name && word ? `${name} · ${word}` : name;
}

/**
 * Whether the entitlement stems from the test phase (dezente "Testzugang"-Notiz).
 *
 * @param source The entitlement source field.
 * @returns True for a test-phase entitlement.
 */
export function isTestPhaseAccess(source?: string): boolean {
  return source === 'test_phase';
}

/**
 * The avatar initial(s) for a display name (first + last, uppercased).
 *
 * @param name The display name (or e-mail).
 * @returns One or two initials, or '?' when empty.
 */
export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (parts[0][0] + last).toUpperCase();
}
