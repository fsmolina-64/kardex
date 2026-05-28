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
import { AttendanceService } from '../../../core/services/attendance.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule,
  ],
  templateUrl: './attendance-list.html',
  styleUrls: ['./attendance-list.css'],
})
export class AttendanceList implements OnInit {
  private service = inject(AttendanceService);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);
  roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  projects = signal<any[]>([]);
  loading = signal(false);

  filterProjectId = signal('');
  filterFrom = signal('');
  filterTo = signal('');

  columns = ['date', 'worker', 'project', 'status', 'hours', 'cost', 'actions'];

  statusLabels: Record<string, string> = {
    PRESENT: 'Presente', ABSENT: 'Ausente',
    HALF_DAY: 'Medio día', EXTRA: 'Horas extra',
  };

  statusColors: Record<string, string> = {
    PRESENT: 'present', ABSENT: 'absent',
    HALF_DAY: 'half', EXTRA: 'extra',
  };

  ngOnInit() {
    this.loadProjects();
    this.load();
  }

  loadProjects() {
    this.projectsService.getAll({ isActive: 'true' }).subscribe({
      next: (res) => this.projects.set(res.data?.data || []),
    });
  }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (this.filterProjectId()) params.projectId = this.filterProjectId();
    if (this.filterFrom()) params.from = this.filterFrom();
    if (this.filterTo()) params.to = this.filterTo();

    this.service.getAll(params).subscribe({
      next: (res) => { this.items.set(res.data?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goRegister() { this.router.navigate(['/attendance/bulk']); }

  remove(item: any) {
    if (!confirm(`¿Eliminar registro de asistencia de "${item.worker?.fullName}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.message || 'Error al eliminar'),
    });
  }
}