import { describe, expect, it } from 'vitest';
import { PLANS } from '../../landing/pricing-data';
import {
  avatarInitials,
  isTestPhaseAccess,
  planLineText,
  planName,
} from './topbar-plan';

describe('topbar-plan helpers', () => {
  it('derives plan names from the shared catalog (no re-hardcoded tariffs)', () => {
    for (const plan of PLANS) expect(planName(plan.id)).toBe(plan.name);
    expect(planName('unknown')).toBe('');
    expect(planName(undefined)).toBe('');
  });

  it('formats the compact plan line per billing cycle', () => {
    expect(planLineText('tester', 'one_time')).toBe('Tester');
    expect(planLineText('starter', 'monthly')).toBe('Starter · monatlich');
    expect(planLineText('creator', 'annual')).toBe('Creator · jährlich');
    expect(planLineText('pro', 'monthly')).toBe('Pro · monatlich');
    expect(planLineText('unknown', 'monthly')).toBe('');
  });

  it('marks only a test_phase source as test access', () => {
    expect(isTestPhaseAccess('test_phase')).toBe(true);
    expect(isTestPhaseAccess('stripe')).toBe(false);
    expect(isTestPhaseAccess(undefined)).toBe(false);
  });

  it('builds avatar initials (first + last, else ?)', () => {
    expect(avatarInitials('Erika Mustermann')).toBe('EM');
    expect(avatarInitials('erika@example.com')).toBe('E');
    expect(avatarInitials('   ')).toBe('?');
  });
});
