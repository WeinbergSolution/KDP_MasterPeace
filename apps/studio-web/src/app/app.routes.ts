import { Route } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/firebase/auth.guard';

/** Lazy-loads the shared legal page component. */
const legal = () =>
  import('./legal/legal-page').then((m) => m.LegalPageComponent);

/** Lazy-loads the studio shell component. */
const studio = () =>
  import('./studio/studio-shell').then((m) => m.StudioShellComponent);

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/verify-email/verify-email').then(
        (m) => m.VerifyEmailComponent,
      ),
  },
  {
    path: 'auth/action',
    loadComponent: () =>
      import('./auth/action/auth-action').then((m) => m.AuthActionComponent),
  },
  { path: 'impressum', data: { doc: 'impressum' }, loadComponent: legal },
  { path: 'datenschutz', data: { doc: 'datenschutz' }, loadComponent: legal },
  {
    path: 'nutzungsbedingungen',
    data: { doc: 'nutzungsbedingungen' },
    loadComponent: legal,
  },
  { path: 'studio', canActivate: [authGuard], loadComponent: studio },
  {
    path: 'studio/projects/:projectId',
    canActivate: [authGuard],
    loadComponent: studio,
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./account/account').then((m) => m.AccountComponent),
  },
  { path: '**', redirectTo: '' },
];
