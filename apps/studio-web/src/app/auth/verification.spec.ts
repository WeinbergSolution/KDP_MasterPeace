import { describe, expect, it } from 'vitest';
import { parseVerifyAction, verificationContinueUrl } from './verification';

const ORIGIN = 'https://kdp-master-peace.vercel.app';

/** Builds a param getter from a plain record. */
function getter(map: Record<string, string>) {
  return (key: string) => map[key] ?? null;
}

describe('verificationContinueUrl', () => {
  it('builds a same-origin /login URL with the verified flag', () => {
    expect(verificationContinueUrl(ORIGIN, null)).toBe(
      `${ORIGIN}/login?verified=1`,
    );
  });

  it('appends an allowlisted plan', () => {
    expect(verificationContinueUrl(ORIGIN, 'creator')).toBe(
      `${ORIGIN}/login?verified=1&plan=creator`,
    );
  });

  it('appends an allowlisted plan and billing cycle', () => {
    expect(verificationContinueUrl(ORIGIN, 'creator', 'annual')).toBe(
      `${ORIGIN}/login?verified=1&plan=creator&billing=annual`,
    );
  });
});

describe('parseVerifyAction', () => {
  it('validates a well-formed verifyEmail action', () => {
    const r = parseVerifyAction(
      getter({ mode: 'verifyEmail', oobCode: 'abc123' }),
      ORIGIN,
    );
    expect(r.valid).toBe(true);
    expect(r.oobCode).toBe('abc123');
    expect(r.loginTarget).toBe('/login?verified=1');
  });

  it('rejects a missing oobCode', () => {
    expect(
      parseVerifyAction(getter({ mode: 'verifyEmail' }), ORIGIN).valid,
    ).toBe(false);
  });

  it('rejects a non-verifyEmail mode (e.g. resetPassword)', () => {
    expect(
      parseVerifyAction(
        getter({ mode: 'resetPassword', oobCode: 'abc' }),
        ORIGIN,
      ).valid,
    ).toBe(false);
  });

  it('extracts an allowlisted plan from a same-origin continueUrl', () => {
    const r = parseVerifyAction(
      getter({
        mode: 'verifyEmail',
        oobCode: 'x',
        continueUrl: `${ORIGIN}/login?verified=1&plan=pro`,
      }),
      ORIGIN,
    );
    expect(r.plan).toBe('pro');
    expect(r.loginTarget).toBe('/login?verified=1&plan=pro');
  });

  it('carries plan + billing from a same-origin continueUrl', () => {
    const r = parseVerifyAction(
      getter({
        mode: 'verifyEmail',
        oobCode: 'x',
        continueUrl: `${ORIGIN}/login?verified=1&plan=creator&billing=annual`,
      }),
      ORIGIN,
    );
    expect(r.loginTarget).toBe('/login?verified=1&plan=creator&billing=annual');
  });

  it('ignores a foreign-origin continueUrl (no open redirect, no plan)', () => {
    const r = parseVerifyAction(
      getter({
        mode: 'verifyEmail',
        oobCode: 'x',
        continueUrl: 'https://evil.example/login?plan=pro',
      }),
      ORIGIN,
    );
    expect(r.plan).toBeNull();
    expect(r.loginTarget).toBe('/login?verified=1');
  });

  it('ignores a non-allowlisted plan in the continueUrl', () => {
    const r = parseVerifyAction(
      getter({
        mode: 'verifyEmail',
        oobCode: 'x',
        continueUrl: `${ORIGIN}/login?plan=admin`,
      }),
      ORIGIN,
    );
    expect(r.plan).toBeNull();
  });
});
