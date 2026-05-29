import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule, MatChipsModule,
  ],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.css'],
})
export class ProjectList implements OnInit {
  private service = inject(ProjectsService);
  private router = inject(Router);
  roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  loading = signal(false);
  showInactive = signal(false);
  filterStatus = signal('');

  columns = ['code', 'name', 'client', 'status', 'budget', 'actions'];

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'PLANNING', label: 'Planificación' },
    { value: 'ACTIVE', label: 'Activa' },
    { value: 'PAUSED', label: 'Pausada' },
    { value: 'FINISHED', label: 'Finalizada' },
  ];

  statusLabels: Record<string, string> = {
    PLANNING: 'Planificación',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    FINISHED: 'Finalizada',
  };

  statusColors: Record<string, string> = {
    PLANNING: 'planning',
    ACTIVE: 'active',
    PAUSED: 'paused',
    FINISHED: 'finished',
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (!this.showInactive()) params.isActive = 'true';
    if (this.filterStatus()) params.status = this.filterStatus();

    this.service.getAll(params).subscribe({
      next: (res) => { this.items.set(res.data?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleInactive() {
    this.showInactive.set(!this.showInactive());
    this.load();
  }

  onStatusFilter() { this.load(); }

  goNew() { this.router.navigate(['/projects/new']); }
  goEdit(id: string) { this.router.navigate(['/projects/edit', id]); }
  goSummary(id: string) { this.router.navigate(['/projects', id, 'summary']); }

  changeStatus(item: any, status: string) {
    if (!confirm(`¿Cambiar estado de "${item.name}" a ${this.statusLabels[status]}?`)) return;
    this.service.changeStatus(item.id, status).subscribe({ next: () => this.load() });
  }

  toggleActive(item: any) {
    const action = item.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${action} la obra "${item.name}"?`)) return;
    const req = item.isActive ? this.service.deactivate(item.id) : this.service.activate(item.id);
    req.subscribe({ next: () => this.load() });
  }

  permanentDelete(item: any) {
    if (!confirm(`¿Eliminar la obra "${item.name}" permanentemente?`)) return;
    this.service.permanentDelete(item.id).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.message || 'No se puede eliminar esta obra'),
    });
  }
}