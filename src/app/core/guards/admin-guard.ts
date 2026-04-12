import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth} from '../services/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth   = inject(Auth);
  const router = inject(Router);

  await auth.waitForSession(); // ← wait for session to resolve

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!auth.isAdmin()) {
    return router.createUrlTree(['/']); // logged in but not admin
  }

  return true;
};