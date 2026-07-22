import { describe, expect, it } from 'vitest';
import { ACTIVE_ENTITLEMENT_STATES, isActiveEntitlement } from './entitlement';

describe('isActiveEntitlement', () => {
  it('treats exactly active and trialing as access-granting', () => {
    expect([...ACTIVE_ENTITLEMENT_STATES]).toEqual(['active', 'trialing']);
    expect(isActiveEntitlement('active')).toBe(true);
    expect(isActiveEntitlement('trialing')).toBe(true);
  });

  it('denies every other or missing status', () => {
    for (const status of [
      'none',
      'pending',
      'incomplete',
      'past_due',
      'canceled',
      'expired',
      'unknown',
      '',
      null,
      undefined,
    ])
      expect(isActiveEntitlement(status)).toBe(false);
  });
});
