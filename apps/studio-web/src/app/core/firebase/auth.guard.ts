import { inject } from '@angular/core';
import { Router, type CanActivateFn, type UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { type AuthGate, guestDecision, protectedDecision } from './access';

// Functional route guards. Both wait for the first Firebase auth state so a
// refresh on a protected URL never flashes the wrong screen, and both reload the
// user so a just-completed e-mail verification is recognised. Protected routes
// require emailVerified === true; unverified accounts go to /verify-email. Deep
// links are blocked here, not only in the UI.

/**
 * Reads the current auth gate, refreshing the user when signed in.
 *
 * @param auth The auth service.
 * @returns The authenticated + emailVerified gate state.
 */
async function readGate(auth: AuthService): Promise<AuthGate> {
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
 * Resolves access to a protected route once auth state is known.
 *
 * @returns True for verified users, or a UrlTree redirect to /login or
 *   /verify-email.
 */
async function requireAuthenticated(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  const decision = protectedDecision(await readGate(auth));
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
  const decision = guestDecision(await readGate(auth));
  return decision === 'studio' ? router.parseUrl('/studio') : true;
}

export const authGuard: CanActivateFn = () => requireAuthenticated();
export const publicOnlyGuard: CanActivateFn = () => requireGuest();
