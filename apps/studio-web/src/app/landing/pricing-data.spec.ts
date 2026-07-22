import { describe, expect, it } from 'vitest';
import { PLANS, billingFor, priceFor } from './pricing-data';

/** Finds a plan by id (present by construction). */
function plan(id: string) {
  return PLANS.find((p) => p.id === id)!;
}

describe('pricing-data', () => {
  it('keeps Tester one-time regardless of the toggle', () => {
    const tester = plan('tester');
    expect(billingFor(tester, 'monthly')).toBe('one_time');
    expect(billingFor(tester, 'annual')).toBe('one_time');
    expect(priceFor(tester, 'annual').value).toBe('9,90');
  });

  it('switches paid plans between monthly and annual', () => {
    const creator = plan('creator');
    expect(billingFor(creator, 'monthly')).toBe('monthly');
    expect(billingFor(creator, 'annual')).toBe('annual');
    expect(priceFor(creator, 'monthly').value).toBe('59');
    expect(priceFor(creator, 'annual').value).toBe('590');
  });

  it('prices the annual option at ten monthly instalments', () => {
    for (const id of ['starter', 'creator', 'pro']) {
      const p = plan(id);
      expect(Number(p.prices.annual?.value)).toBe(
        Number(p.prices.monthly?.value) * 10,
      );
    }
  });
});
