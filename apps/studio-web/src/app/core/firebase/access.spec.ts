import { describe, expect, it } from 'vitest';
import { guestDecision, protectedDecision, studioDecision } from './access';

describe('studioDecision', () => {
  it('sends an unauthenticated user to login', () => {
    expect(
      studioDecision({
        authenticated: false,
        emailVerified: false,
        entitlementActive: false,
      }),
    ).toBe('login');
  });

  it('sends an unverified user to verify-email', () => {
    expect(
      studioDecision({
        authenticated: true,
        emailVerified: false,
        entitlementActive: false,
      }),
    ).toBe('verify-email');
  });

  it('sends a verified user without entitlement to choose-plan', () => {
    expect(
      studioDecision({
        authenticated: true,
        emailVerified: true,
        entitlementActive: false,
      }),
    ).toBe('choose-plan');
  });

  it('allows a verified user with an active entitlement', () => {
    expect(
      studioDecision({
        authenticated: true,
        emailVerified: true,
        entitlementActive: true,
      }),
    ).toBe('allow');
  });
});

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
