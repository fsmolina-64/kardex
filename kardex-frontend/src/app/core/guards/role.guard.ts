import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthRoleService } from '../services/auth-role.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const roles = inject(AuthRoleService);
  const router = inject(Router);
  const permission = route.data['permission'] as string;

  if (!permission) return true;
  if (roles.can(permission as any)) return true;

  router.navigate(['/dashboard']);
  return false;
};