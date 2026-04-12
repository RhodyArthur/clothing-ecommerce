import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';


export const authGuard: CanActivateFn = async (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;

  await auth.waitForSession();

  // Preserve the intended URL so we can redirect after login
  const intended = route.url.map(s => s.path).join('/');
  return router.createUrlTree(['/auth/login'], {
    queryParams: intended ? { returnUrl: intended } : {}
  });
};