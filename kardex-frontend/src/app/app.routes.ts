import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/product-list/product-list').then(m => m.ProductList)
      },
      {
        path: 'products/new',
        canActivate: [roleGuard],
        data: { permission: 'canCreateProducts' },
        loadComponent: () => import('./features/products/product-form/product-form').then(m => m.ProductForm)
      },
      {
        path: 'products/edit/:id',
        canActivate: [roleGuard],
        data: { permission: 'canEditProducts' },
        loadComponent: () => import('./features/products/product-form/product-form').then(m => m.ProductForm)
      },
      {
        path: 'movements',
        loadComponent: () => import('./features/movements/movement-list/movement-list').then(m => m.MovementList)
      },
      {
        path: 'movements/entry',
        canActivate: [roleGuard],
        data: { permission: 'canRegisterEntry' },
        loadComponent: () => import('./features/movements/entry-form/entry-form').then(m => m.EntryForm)
      },
      {
        path: 'movements/exit',
        canActivate: [roleGuard],
        data: { permission: 'canRegisterExit' },
        loadComponent: () => import('./features/movements/exit-form/exit-form').then(m => m.ExitForm)
      },
      {
        path: 'movements/transfer',
        canActivate: [roleGuard],
        data: { permission: 'canRegisterTransfer' },
        loadComponent: () => import('./features/movements/transfer-form/transfer-form').then(m => m.TransferForm)
      },
      {
        path: 'kardex',
        loadComponent: () => import('./features/kardex/kardex').then(m => m.Kardex)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then(m => m.Reports)
      },
      {
        path: 'masters/categories',
        loadComponent: () => import('./features/masters/categories/categories').then(m => m.Categories)
      },
      {
        path: 'masters/units',
        loadComponent: () => import('./features/masters/units/units').then(m => m.Units)
      },
      {
        path: 'masters/suppliers',
        loadComponent: () => import('./features/masters/suppliers/suppliers').then(m => m.Suppliers)
      },
      {
        path: 'masters/clients',
        loadComponent: () => import('./features/masters/clients/clients').then(m => m.Clients)
      },
      {
        path: 'masters/warehouses',
        loadComponent: () => import('./features/masters/warehouses/warehouses').then(m => m.Warehouses)
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { permission: 'canManageUsers' },
        loadComponent: () => import('./features/admin/users/users').then(m => m.Users)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list/project-list').then(m => m.ProjectList)
      },
      {
        path: 'projects/new',
        canActivate: [roleGuard],
        data: { permission: 'canManageProjects' },
        loadComponent: () => import('./features/projects/project-form/project-form').then(m => m.ProjectForm)
      },
      {
        path: 'projects/edit/:id',
        canActivate: [roleGuard],
        data: { permission: 'canManageProjects' },
        loadComponent: () => import('./features/projects/project-form/project-form').then(m => m.ProjectForm)
      },
      {
        path: 'workers',
        loadComponent: () => import('./features/workers/worker-list/worker-list').then(m => m.WorkerList)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance-list/attendance-list').then(m => m.AttendanceList)
      },
      {
        path: 'attendance/bulk',
        canActivate: [roleGuard],
        data: { permission: 'canRegisterAttendance' },
        loadComponent: () => import('./features/attendance/attendance-bulk/attendance-bulk').then(m => m.AttendanceBulk)
      },
      // HERRAMIENTAS
      {
        path: 'tool-assignments',
        loadComponent: () => import('./features/tool-assignments/tool-assignment-list/tool-assignment-list').then(m => m.ToolAssignmentList)
      },
      // MOVIMIENTOS NUEVOS
      {
        path: 'movements/consumo',
        canActivate: [roleGuard],
        data: { permission: 'canRegisterConsumo' },
        loadComponent: () => import('./features/movements/consumo-form/consumo-form').then(m => m.ConsumoForm)
      },
      {
        path: 'movements/devolucion-obra',
        canActivate: [roleGuard],
        data: { permission: 'canRegisterConsumo' },
        loadComponent: () => import('./features/movements/devolucion-obra-form/devolucion-obra-form').then(m => m.DevolucionObraForm)
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];