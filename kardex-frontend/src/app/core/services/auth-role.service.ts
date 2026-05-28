import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type AppRole = 'SUPER_ADMIN' | 'BODEGUERO' | 'VENDEDOR' | 'CONTADOR' | 'VIEWER';

export interface RolePermissions {
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canCreateMasters: boolean;
  canDeleteMasters: boolean;
  canRegisterEntry: boolean;
  canRegisterExit: boolean;
  canRegisterTransfer: boolean;
  canManageUsers: boolean;
  canViewAll: boolean;
  canPrint: boolean;
  canManageProjects: boolean;
  canManageWorkers: boolean;
  canRegisterAttendance: boolean;
  canRegisterConsumo: boolean;
}

const PERMISSIONS: Record<AppRole, RolePermissions> = {
  SUPER_ADMIN: {
    canCreateProducts: true, canEditProducts: true, canDeleteProducts: true,
    canCreateMasters: true, canDeleteMasters: true,
    canRegisterEntry: true, canRegisterExit: true, canRegisterTransfer: true,
    canManageUsers: true, canViewAll: true, canPrint: true,
    canManageProjects: true, canManageWorkers: true, canRegisterAttendance: true, canRegisterConsumo: true,
  },
  BODEGUERO: {
    canCreateProducts: true, canEditProducts: true, canDeleteProducts: false,
    canCreateMasters: true, canDeleteMasters: false,
    canRegisterEntry: true, canRegisterExit: true, canRegisterTransfer: true,
    canManageUsers: false, canViewAll: true, canPrint: true,
    canManageProjects: true, canManageWorkers: true, canRegisterAttendance: true, canRegisterConsumo: true,
  },
  VENDEDOR: {
    canCreateProducts: false, canEditProducts: false, canDeleteProducts: false,
    canCreateMasters: false, canDeleteMasters: false,
    canRegisterEntry: false, canRegisterExit: true, canRegisterTransfer: false,
    canManageUsers: false, canViewAll: true, canPrint: true,
    canManageProjects: false, canManageWorkers: false, canRegisterAttendance: false, canRegisterConsumo: false,
  },
  CONTADOR: {
    canCreateProducts: false, canEditProducts: false, canDeleteProducts: false,
    canCreateMasters: false, canDeleteMasters: false,
    canRegisterEntry: false, canRegisterExit: false, canRegisterTransfer: false,
    canManageUsers: false, canViewAll: true, canPrint: true,
    canManageProjects: false, canManageWorkers: false, canRegisterAttendance: false, canRegisterConsumo: false,
  },
  VIEWER: {
    canCreateProducts: false, canEditProducts: false, canDeleteProducts: false,
    canCreateMasters: false, canDeleteMasters: false,
    canRegisterEntry: false, canRegisterExit: false, canRegisterTransfer: false,
    canManageUsers: false, canViewAll: true, canPrint: true,
    canManageProjects: false, canManageWorkers: false, canRegisterAttendance: false, canRegisterConsumo: false,
  },
};

@Injectable({ providedIn: 'root' })
export class AuthRoleService {
  private auth = inject(AuthService);

  getRole(): AppRole {
    const roles = this.auth.currentUser()?.roles || [];
    if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
    if (roles.includes('BODEGUERO')) return 'BODEGUERO';
    if (roles.includes('VENDEDOR')) return 'VENDEDOR';
    if (roles.includes('CONTADOR')) return 'CONTADOR';
    return 'VIEWER';
  }

  get permissions(): RolePermissions {
    return PERMISSIONS[this.getRole()];
  }

  can(permission: keyof RolePermissions): boolean {
    return this.permissions[permission];
  }
}