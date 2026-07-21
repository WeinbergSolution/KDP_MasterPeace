import { describe, expect, it } from 'vitest';
import { guestDecision, protectedDecision } from './access';

describe('protectedDecision', () => {
  it('sends an unauthenticated user to login', () => {
    expect(
      protectedDecision({ authenticated: false, emailVerified: false }),
    ).toBe('login');
  });

  it('sends a signed-in but unverified user to verify-email', () => {
    expect(
      protectedDecision({ authenticated: true, emailVerified: false }),
    ).toBe('verify-email');
  });

  it('allows a signed-in and verified user', () => {
    expect(
      protectedDecision({ authenticated: true, emailVerified: true }),
    ).toBe('allow');
  });
});

describe('guestDecision', () => {
  it('allows guests on public-only routes', () => {
    expect(guestDecision({ authenticated: false, emailVerified: false })).toBe(
      'allow',
    );
  });

  it('allows an unverified user to stay on login/register', () => {
    expect(guestDecision({ authenticated: true, emailVerified: false })).toBe(
      'allow',
    );
  });

  it('redirects a verified user to the studio', () => {
    expect(guestDecision({ authenticated: true, emailVerified: true })).toBe(
      'studio',
    );
  });
});
