import { describe, expect, it } from 'vitest';
import { estimatePageCount } from './page-estimator.js';

describe('estimatePageCount', () => {
  it('matches the legacy heuristic for a typical workbook', () => {
    // ceil(2000/235)=9 + round(8×1.5)=12 + 5 = 26
    expect(estimatePageCount(2000, 8)).toBe(26);
  });

  it('adds the fixed matter allowance only when there is content', () => {
    expect(estimatePageCount(0, 0)).toBe(0);
    expect(estimatePageCount(235, 1)).toBe(8); // 1 + 2 + 5
  });

  it('counts chapter overhead even with zero words', () => {
    expect(estimatePageCount(0, 5)).toBe(8); // 0 + round(7.5)=8 + 0
  });

  it('rejects negative inputs', () => {
    expect(() => estimatePageCount(-1, 0)).toThrow();
    expect(() => estimatePageCount(0, -1)).toThrow();
  });
});
