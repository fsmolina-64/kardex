import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { AuthRoleService } from '../../core/services/auth-role.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  permission?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  @Input() collapsed = false;
  authService = inject(AuthService);
  private roles = inject(AuthRoleService);
  private router = inject(Router);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Productos', icon: 'inventory_2', route: '/products' },
    {
      label: 'Obras', icon: 'construction', route: '/projects',
      permission: 'canManageProjects'
    },
    {
      label: 'Movimientos', icon: 'swap_horiz', expanded: false, children: [
        { label: 'Ver todos', icon: 'list', route: '/movements' },
        { label: 'Entrada', icon: 'add_circle', route: '/movements/entry', permission: 'canRegisterEntry' },
        { label: 'Salida', icon: 'remove_circle', route: '/movements/exit', permission: 'canRegisterExit' },
        { label: 'Traslado', icon: 'compare_arrows', route: '/movements/transfer', permission: 'canRegisterTransfer' },
        { label: 'Consumo Obra', icon: 'handyman', route: '/movements/consumo', permission: 'canRegisterConsumo' },
        { label: 'Devolución Obra', icon: 'undo', route: '/movements/devolucion-obra', permission: 'canRegisterConsumo' },
      ]
    },
    { label: 'Kardex', icon: 'table_chart', route: '/kardex' },
    { label: 'Reportes', icon: 'bar_chart', route: '/reports' },
    {
      label: 'Mano de Obra', icon: 'groups', expanded: false, children: [
        { label: 'Trabajadores', icon: 'badge', route: '/workers' },
        { label: 'Asistencia', icon: 'fact_check', route: '/attendance' },
        { label: 'Registrar Asistencia', icon: 'edit_calendar', route: '/attendance/bulk', permission: 'canRegisterAttendance' },
      ]
    },
    {
      label: 'Herramientas', icon: 'build', route: '/tool-assignments'
    },
    {
      label: 'Maestros', icon: 'tune', expanded: false, children: [
        { label: 'Categorías', icon: 'category', route: '/masters/categories' },
        { label: 'Unidades', icon: 'straighten', route: '/masters/units' },
        { label: 'Proveedores', icon: 'local_shipping', route: '/masters/suppliers' },
        { label: 'Clientes', icon: 'people', route: '/masters/clients' },
        { label: 'Bodegas', icon: 'warehouse', route: '/masters/warehouses' },
      ]
    },
    {
      label: 'Administración', icon: 'admin_panel_settings',
      permission: 'canManageUsers', children: [
        { label: 'Usuarios', icon: 'manage_accounts', route: '/admin/users' },
      ]
    },
  ];

  canShow(item: MenuItem): boolean {
    if (!item.permission) return true;
    return this.roles.can(item.permission as any);
  }

  navigate(route?: string) {
    if (route) this.router.navigate([route]);
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  toggleMenu(item: MenuItem) {
    item.expanded = !item.expanded;
  }

  getRoleLabel(): string {
    const labels: any = {
      SUPER_ADMIN: 'Administrador',
      BODEGUERO: 'Bodeguero',
      VENDEDOR: 'Vendedor',
      CONTADOR: 'Contador',
      VIEWER: 'Solo lectura',
    };
    return labels[this.roles.getRole()] || '';
  }
}