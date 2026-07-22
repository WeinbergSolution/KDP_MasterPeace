import { describe, expect, it } from 'vitest';
import {
  ANNUAL_SAVING_NOTE,
  PLANS,
  annualPerMonthCents,
  annualSavings,
  annualSavingsCents,
  billingFor,
  euro,
  monthlyEquivalent,
  priceFor,
} from './pricing-data';

/** Finds a plan by id (present by construction). */
function plan(id: string) {
  return PLANS.find((p) => p.id === id)!;
}

describe('pricing-data', () => {
  it('formats cents as German euro values', () => {
    expect(euro(2900)).toBe('29');
    expect(euro(990)).toBe('9,90');
    expect(euro(30624)).toBe('306,24');
    expect(euro(60180)).toBe('601,80');
    expect(euro(95040)).toBe('950,40');
    expect(euro(118800)).toBe('1.188');
  });

  it('keeps Tester one-time at 990 cents regardless of the toggle', () => {
    const tester = plan('tester');
    expect(tester.oneTimeCents).toBe(990);
    expect(tester.monthlyCents).toBeUndefined();
    expect(tester.annualCents).toBeUndefined();
    expect(billingFor(tester, 'monthly')).toBe('one_time');
    expect(billingFor(tester, 'annual')).toBe('one_time');
    expect(priceFor(tester, 'annual').value).toBe('9,90');
  });

  it('prices monthly billing at the plain monthly amount', () => {
    expect(priceFor(plan('starter'), 'monthly').value).toBe('29');
    expect(priceFor(plan('creator'), 'monthly').value).toBe('59');
    expect(priceFor(plan('pro'), 'monthly').value).toBe('99');
  });

  it('derives the annual price from twelve monthly instalments minus the discount', () => {
    for (const id of ['starter', 'creator', 'pro']) {
      const p = plan(id);
      const pct = p.annualDiscountPercent!;
      expect(p.annualCents).toBe(
        Math.round((p.monthlyCents ?? 0) * 12 * (1 - pct / 100)),
      );
    }
  });

  it('has the exact Starter annual figures (12 %)', () => {
    const p = plan('starter');
    expect(p.annualCents).toBe(30624);
    expect(p.annualDiscountPercent).toBe(12);
    expect(annualSavingsCents(p)).toBe(4176);
    expect(annualPerMonthCents(p)).toBe(2552);
    expect(priceFor(p, 'annual').value).toBe('306,24');
    expect(monthlyEquivalent(p)).toBe('25,52');
    expect(annualSavings(p)).toBe('41,76');
  });

  it('has the exact Creator annual figures (15 %)', () => {
    const p = plan('creator');
    expect(p.annualCents).toBe(60180);
    expect(p.annualDiscountPercent).toBe(15);
    expect(annualSavingsCents(p)).toBe(10620);
    expect(annualPerMonthCents(p)).toBe(5015);
    expect(priceFor(p, 'annual').value).toBe('601,80');
    expect(monthlyEquivalent(p)).toBe('50,15');
    expect(annualSavings(p)).toBe('106,20');
  });

  it('has the exact Pro annual figures (20 %)', () => {
    const p = plan('pro');
    expect(p.annualCents).toBe(95040);
    expect(p.annualDiscountPercent).toBe(20);
    expect(annualSavingsCents(p)).toBe(23760);
    expect(annualPerMonthCents(p)).toBe(7920);
    expect(priceFor(p, 'annual').value).toBe('950,40');
    expect(monthlyEquivalent(p)).toBe('79,20');
    expect(annualSavings(p)).toBe('237,60');
  });

  it('no longer uses the old flat annual prices', () => {
    for (const id of ['starter', 'creator', 'pro']) {
      const annual = priceFor(plan(id), 'annual').value;
      expect(['290', '590', '990']).not.toContain(annual);
    }
    expect(plan('creator').annualCents).not.toBe(59000);
  });

  it('drops the flat "2 Monatsbeiträge sparen" annual claim', () => {
    expect(ANNUAL_SAVING_NOTE).not.toContain('Monatsbeiträge');
    expect(ANNUAL_SAVING_NOTE).not.toContain('2 Monat');
  });
});
