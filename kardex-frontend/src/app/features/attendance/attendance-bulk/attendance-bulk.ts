import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AttendanceService } from '../../../core/services/attendance.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { WorkersService } from '../../../core/services/workers.service';

interface AttendanceRow {
  workerId: string;
  fullName: string;
  workerRole: string;
  dailyRate: number;
  status: string;
  hoursWorked: string;
  notes: string;
}

@Component({
  selector: 'app-attendance-bulk',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule, MatTableModule, MatTooltipModule,
  ],
  templateUrl: './attendance-bulk.html',
  styleUrls: ['./attendance-bulk.css'],
})
export class AttendanceBulk implements OnInit {
  private attendanceService = inject(AttendanceService);
  private projectsService = inject(ProjectsService);
  private workersService = inject(WorkersService);
  private router = inject(Router);

  projects = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  result = signal<any>(null);

  selectedProjectId = signal('');
  selectedDate = signal(new Date().toISOString().substring(0, 10));
  rows = signal<AttendanceRow[]>([]);

  columns = ['fullName', 'role', 'rate', 'status', 'hours', 'cost'];

  statusOptions = [
    { value: 'PRESENT', label: 'Presente' },
    { value: 'ABSENT', label: 'Ausente' },
    { value: 'HALF_DAY', label: 'Medio día' },
    { value: 'EXTRA', label: 'Horas extra' },
  ];

  ngOnInit() { this.loadProjects(); }

  loadProjects() {
    this.projectsService.getAll({ isActive: 'true' }).subscribe({
      next: (res) => this.projects.set(res.data?.data || []),
    });
  }

  loadWorkers() {
    if (!this.selectedProjectId()) return;
    this.loading.set(true);
    this.workersService.getAll({ isActive: 'true', limit: 100 }).subscribe({
      next: (res) => {
        const workers = res.data?.data || [];
        this.rows.set(workers.map((w: any) => ({
          workerId: w.id,
          fullName: w.fullName,
          workerRole: w.workerRole,
          dailyRate: Number(w.dailyRate),
          status: 'PRESENT',
          hoursWorked: '',
          notes: '',
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  calcCost(row: AttendanceRow): number {
    switch (row.status) {
      case 'PRESENT':  return row.dailyRate;
      case 'HALF_DAY': return row.dailyRate * 0.5;
      case 'ABSENT':   return 0;
      case 'EXTRA':
        const h = Number(row.hoursWorked) || 8;
        return (row.dailyRate / 8) * h * 1.25;
      default: return 0;
    }
  }

  totalCost(): number {
    return this.rows().reduce((sum, r) => sum + this.calcCost(r), 0);
  }

  save() {
    if (this.saving() || !this.selectedProjectId() || !this.selectedDate() || this.rows().length === 0) return;

    const extraSinHoras = this.rows().filter(r => r.status === 'EXTRA' && !r.hoursWorked);
    if (extraSinHoras.length > 0) {
      alert(`Faltan horas en: ${extraSinHoras.map(r => r.fullName).join(', ')}`);
      return;
    }

    this.saving.set(true);
    const payload = {
      projectId: this.selectedProjectId(),
      date: this.selectedDate(),
      attendances: this.rows().map(r => ({
        workerId: r.workerId,
        status: r.status,
        hoursWorked: r.hoursWorked || undefined,
        notes: r.notes || undefined,
      })),
    };

    this.attendanceService.bulkCreate(payload).subscribe({
      next: (res) => {
        this.result.set(res.data);
        this.saving.set(false);
      },
      error: (err: any) => {
        alert(err.error?.message || 'Error al registrar');
        this.saving.set(false);
      },
    });
  }

  cancel() { this.router.navigate(['/attendance']); }
}