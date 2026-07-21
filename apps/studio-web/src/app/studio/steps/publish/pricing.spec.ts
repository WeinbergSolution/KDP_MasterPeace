import { describe, expect, it } from 'vitest';
import { computePricing, estimatePrintCost } from './pricing';

describe('estimatePrintCost', () => {
  it('uses the flat rate for short paperbacks (≤108 pages)', () => {
    expect(estimatePrintCost(100, 'paperback')).toBeCloseTo(1.93, 2);
  });

  it('scales the paperback cost above 108 pages', () => {
    // 0.6 + 0.012 * 200 = 3.0
    expect(estimatePrintCost(200, 'paperback')).toBeCloseTo(3.0, 2);
  });

  it('uses the flat rate for short hardcovers (≤108 pages)', () => {
    expect(estimatePrintCost(100, 'hardcover')).toBeCloseTo(6.05, 2);
  });

  it('scales the hardcover cost above 108 pages', () => {
    // 4.65 + 0.014 * 200 = 7.45
    expect(estimatePrintCost(200, 'hardcover')).toBeCloseTo(7.45, 2);
  });

  it('floors the page count at 24', () => {
    expect(estimatePrintCost(0, 'paperback')).toBe(
      estimatePrintCost(24, 'paperback'),
    );
  });
});

describe('computePricing', () => {
  it('computes a positive print royalty (60 % of net minus cost)', () => {
    const r = computePricing(200, 'paperback', 12.99, 4.99);
    // netto = 12.99/1.07 = 12.14; 0.6*12.14 - 3.0 = 4.28
    expect(r.royalty).toBeCloseTo(4.28, 2);
  });

  it('flags a negative royalty when the price is too low', () => {
    expect(computePricing(500, 'paperback', 3, 4.99).royalty).toBeLessThan(0);
  });

  it('derives the minimum list price from the cost and royalty rate', () => {
    const r = computePricing(200, 'paperback', 12.99, 4.99);
    // ceil((3.0/0.6)*1.07*100)/100 = 5.35
    expect(r.minPrice).toBeCloseTo(5.35, 2);
  });

  it('applies the 70 % e-book rate inside 2,99–9,99 €', () => {
    const r = computePricing(200, 'paperback', 12.99, 4.99);
    expect(r.e70).toBe(true);
    // 0.7 * (4.99/1.07) = 3.2645
    expect(r.eRoyalty).toBeCloseTo(3.26, 2);
  });

  it('applies the 35 % e-book rate outside the 70 % band', () => {
    const r = computePricing(200, 'paperback', 12.99, 12.99);
    expect(r.e70).toBe(false);
    // 0.35 * (12.99/1.07) = 4.249
    expect(r.eRoyalty).toBeCloseTo(4.25, 2);
  });
});
