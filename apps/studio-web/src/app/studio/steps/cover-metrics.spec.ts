import { describe, expect, it } from 'vitest';
import {
  coverDimensions,
  spineTextPossible,
  spineWidthMm,
} from './cover-metrics';

describe('spineWidthMm', () => {
  it('falls back to the estimated pages when no count is entered', () => {
    expect(spineWidthMm(0, 'cream', 240).pages).toBe(240);
  });

  it('uses the entered page count over the fallback', () => {
    expect(spineWidthMm(300, 'cream', 240).pages).toBe(300);
  });

  it('computes the cream spine width in mm', () => {
    // 240 * 0.0025 * 25.4 = 15.24 mm
    expect(spineWidthMm(240, 'cream', 0).mm).toBeCloseTo(15.24, 2);
  });

  it('a white-paper spine is thinner than a cream one', () => {
    expect(spineWidthMm(240, 'white', 0).mm).toBeLessThan(
      spineWidthMm(240, 'cream', 0).mm,
    );
  });

  it('defaults to 120 pages when nothing is available', () => {
    expect(spineWidthMm(0, 'cream', 0).pages).toBe(120);
  });
});

describe('coverDimensions', () => {
  it('adds two trims, the spine and bleed on both edges', () => {
    // 7x10 trim = 177.8 x 254 mm, spine 15.24 mm
    const { widthMm, heightMm } = coverDimensions(177.8, 254, 15.24);
    expect(widthMm).toBeCloseTo(177.8 * 2 + 15.24 + 6.35, 2);
    expect(heightMm).toBeCloseTo(254 + 6.35, 2);
  });

  it('a larger trim yields a larger cover', () => {
    const small = coverDimensions(127, 203.2, 15.24);
    const large = coverDimensions(215.9, 279.4, 15.24);
    expect(large.widthMm).toBeGreaterThan(small.widthMm);
    expect(large.heightMm).toBeGreaterThan(small.heightMm);
  });
});

describe('spineTextPossible', () => {
  it('is false below 100 pages', () => {
    expect(spineTextPossible(99)).toBe(false);
  });

  it('is true from 100 pages', () => {
    expect(spineTextPossible(100)).toBe(true);
  });
});
