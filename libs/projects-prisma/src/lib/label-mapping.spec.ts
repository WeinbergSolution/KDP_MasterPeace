import { describe, expect, it } from 'vitest';
import { fromPrismaLabel, toPrismaLabel } from './label-mapping.js';

describe('version label mapping', () => {
  it('maps pre-repair to the Prisma enum value and back', () => {
    expect(toPrismaLabel('pre-repair')).toBe('pre_repair');
    expect(fromPrismaLabel('pre_repair')).toBe('pre-repair');
  });

  it('passes other labels through unchanged', () => {
    for (const label of ['autosave', 'snapshot', 'export'] as const) {
      expect(toPrismaLabel(label)).toBe(label);
      expect(fromPrismaLabel(label)).toBe(label);
    }
  });
});
