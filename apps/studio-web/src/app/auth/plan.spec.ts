import { describe, expect, it } from 'vitest';
import { ALLOWED_PLANS, allowedPlan } from './plan';

describe('allowedPlan', () => {
  it('accepts each allowlisted plan id', () => {
    for (const id of ALLOWED_PLANS) expect(allowedPlan(id)).toBe(id);
  });

  it('accepts exactly tester/starter/creator/pro', () => {
    expect([...ALLOWED_PLANS]).toEqual(['tester', 'starter', 'creator', 'pro']);
  });

  it('rejects unknown, empty, wrong-case and injection values', () => {
    for (const value of [
      '',
      'admin',
      'free',
      'TESTER',
      'Creator',
      'tester ',
      '../studio',
      'pro;drop',
      null,
      undefined,
    ])
      expect(allowedPlan(value)).toBeNull();
  });
});
