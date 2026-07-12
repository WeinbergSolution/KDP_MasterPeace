import { describe, expect, it } from 'vitest';
import { estimateStepCostCents } from './cost-estimator.js';

const pricing = { inputPricePerMTokCents: 300, outputPricePerMTokCents: 1500 };

describe('estimateStepCostCents', () => {
  it('bands cost as input-only / +P50 / +P90', () => {
    const band = estimateStepCostCents(
      { inputTokens: 1000, outputTokensP50: 500, outputTokensP90: 800 },
      pricing,
    );
    expect(band.minCents).toBeCloseTo(0.3, 6); // input only
    expect(band.expectedCents).toBeCloseTo(1.05, 6); // 0.3 + 0.75
    expect(band.maxCents).toBeCloseTo(1.5, 6); // 0.3 + 1.2
  });

  it('keeps min <= expected <= max', () => {
    const band = estimateStepCostCents(
      { inputTokens: 4200, outputTokensP50: 1800, outputTokensP90: 3000 },
      pricing,
    );
    expect(band.minCents).toBeLessThanOrEqual(band.expectedCents);
    expect(band.expectedCents).toBeLessThanOrEqual(band.maxCents);
  });

  it('rejects negative token or price values', () => {
    expect(() =>
      estimateStepCostCents(
        { inputTokens: -1, outputTokensP50: 0, outputTokensP90: 0 },
        pricing,
      ),
    ).toThrow();
  });
});
