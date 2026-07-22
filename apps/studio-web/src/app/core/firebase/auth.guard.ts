import { inject } from '@angular/core';
import { Router, type CanActivateFn, type UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { EntitlementService } from './entitlement.service';
import {
  type AuthGate,
  guestDecision,
  protectedDecision,
  studioDecision,
} from './access';

// Functional route guards. All wait for the first Firebase auth state and reload
// the user so a just-completed verification is recognised. The studio guard adds
// the server-controlled entitlement check — a plan-selection intent never grants
// access. Deep links are blocked here, not only in the UI; the studio never
// flashes while the gate is still resolving (the guard resolves before render).

const STUDIO_REDIRECT: Record<
  'login' | 'verify-email' | 'choose-plan',
  string
> = {
  login: '/login',
  'verify-email': '/verify-email',
  'choose-plan': '/tarif-waehlen',
};

/**
 * Reads the auth-only gate, refreshing the user when signed in.
 *
 * @param auth The auth service.
 * @returns The authenticated + emailVerified gate state.
 */
async function readAuthGate(auth: AuthService): Promise<AuthGate> {
  await auth.whenReady();
  if (auth.isAuthenticated()) {
    try {
      await auth.reload();
    } catch {
      /* keep the last known auth state on a transient reload failure */
    }
  }
  return {
    authenticated: auth.isAuthenticated(),
    emailVerified: auth.isEmailVerified(),
  };
}

/**
 * Resolves access to the studio: signed in, verified AND active entitlement.
 *
 * @returns True with an active entitlement; else a redirect (login /
 *   verify-email / tarif-waehlen).
 */
async function requireStudio(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ent = inject(EntitlementService);
  const base = await readAuthGate(auth);
  const active =
    base.authenticated && base.emailVerified
      ? await ent.hasActiveAccess()
      : false;
  const decision = studioDecision({ ...base, entitlementActive: active });
  return decision === 'allow'
    ? true
    : router.parseUrl(STUDIO_REDIRECT[decision]);
}

/**
 * Resolves access to a verified-only route (plan selection, checkout).
 *
 * @returns True for verified users, or a redirect to /login or /verify-email.
 */
async function requireVerified(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const decision = protectedDecision(await readAuthGate(auth));
  if (decision === 'allow') return true;
  return router.parseUrl(
    decision === 'verify-email' ? '/verify-email' : '/login',
  );
}

/**
 * Resolves access to a public-only route (login/register) once auth is known.
 *
 * @returns True for guests and unverified users, or a redirect to /studio.
 */
async function requireGuest(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const decision = guestDecision(await readAuthGate(auth));
  return decision === 'studio' ? router.parseUrl('/studio') : true;
}

/**
 * Resolves access to a signed-in-only route (the account area).
 *
 * @returns True when signed in, or a redirect to /login.
 */
async function requireLoggedIn(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const gate = await readAuthGate(auth);
  return gate.authenticated ? true : router.parseUrl('/login');
}

export const authGuard: CanActivateFn = () => requireStudio();
export const verifiedGuard: CanActivateFn = () => requireVerified();
export const loggedInGuard: CanActivateFn = () => requireLoggedIn();
export const publicOnlyGuard: CanActivateFn = () => requireGuest();
