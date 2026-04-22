import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = async (_, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Fast-path for already-hydrated authenticated sessions.
  if (auth.isLoggedIn()) return true;

  // Wait for initial session hydration on full page refresh.
  await auth.waitForSession();

  // Re-check after hydration; refresh should not bounce logged-in users.
  if (auth.isLoggedIn()) return true;

  // Preserve the intended URL so we can redirect after login
  const intended = state.url;
  return router.createUrlTree(['/auth/login'], {
    queryParams: intended ? { returnUrl: intended } : {},
  });
};
