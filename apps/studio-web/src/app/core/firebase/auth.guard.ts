import { inject } from '@angular/core';
import { Router, type CanActivateFn, type UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

// Functional route guards. Both wait for the first Firebase auth state so a
// refresh on a protected URL never flashes the wrong screen.

/**
 * Resolves access to a protected route once auth state is known.
 *
 * @returns True for signed-in users, or a UrlTree redirect to /login.
 */
async function requireAuthenticated(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.whenReady()) ? true : router.parseUrl('/login');
}

/**
 * Resolves access to a public-only route (login/register) once auth is known.
 *
 * @returns True for guests, or a UrlTree redirect to /studio.
 */
async function requireGuest(): Promise<boolean | UrlTree> {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.whenReady()) ? router.parseUrl('/studio') : true;
}

export const authGuard: CanActivateFn = () => requireAuthenticated();
export const publicOnlyGuard: CanActivateFn = () => requireGuest();
