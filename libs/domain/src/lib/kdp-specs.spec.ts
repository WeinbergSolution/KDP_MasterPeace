import { describe, expect, it } from 'vitest';
import { coverDimensions, spineWidthMm, TRIMS } from './kdp-specs.js';

describe('spineWidthMm', () => {
  it('matches the legacy formula for cream paper', () => {
    // 151 pages × 0.0025 in/page × 25.4 mm/in = 9.5885 → 9.59
    expect(spineWidthMm(151, 'cream')).toBe(9.59);
  });

  it('matches the legacy formula for white paper', () => {
    // 300 × 0.002252 × 25.4 = 17.16024 → 17.16
    expect(spineWidthMm(300, 'white')).toBe(17.16);
  });

  it('is zero for a zero page count', () => {
    expect(spineWidthMm(0, 'cream')).toBe(0);
  });

  it('rejects a negative page count', () => {
    expect(() => spineWidthMm(-1, 'cream')).toThrow();
  });
});

describe('coverDimensions', () => {
  it('computes back+spine+front width and bleed height for 7x10/200p', () => {
    const dims = coverDimensions('7x10', 'cream', 200);
    // width = 177.8×2 + 12.7 + 3.175×2 = 374.65; height = 254 + 6.35 = 260.35
    expect(dims.widthMm).toBe(374.65);
    expect(dims.heightMm).toBe(260.35);
    expect(dims.spineWidthMm).toBe(12.7);
    expect(dims.hasSpineText).toBe(true);
  });

  it('disables spine text below 100 pages', () => {
    expect(coverDimensions('6x9', 'cream', 80).hasSpineText).toBe(false);
  });

  it('exposes all five KDP trim sizes', () => {
    expect(Object.keys(TRIMS)).toHaveLength(5);
    expect(TRIMS['7x10']).toEqual({ widthMm: 177.8, heightMm: 254 });
  });
});
