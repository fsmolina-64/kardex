import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../../core/services/api.service';
import { ProjectsService } from '../../../core/services/projects.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule,
  ],
  templateUrl: './project-form.html',
  styleUrls: ['./project-form.css'],
})
export class ProjectForm implements OnInit {
  private service = inject(ProjectsService);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  isEdit = signal(false);
  editId = signal('');

  clients = signal<any[]>([]);
  supervisors = signal<any[]>([]);

  formData = {
    name: '',
    code: '',
    address: '',
    clientId: '',
    supervisorId: '',
    status: 'PLANNING',
    startDate: '',
    estimatedEndDate: '',
    budget: '',
    notes: '',
  };

  statusOptions = [
    { value: 'PLANNING', label: 'Planificación' },
    { value: 'ACTIVE', label: 'Activa' },
    { value: 'PAUSED', label: 'Pausada' },
    { value: 'FINISHED', label: 'Finalizada' },
  ];

  ngOnInit() {
    this.loadClients();
    this.loadSupervisors();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(id);
      this.loadProject(id);
    }
  }

  loadClients() {
    this.api.get<any>('clients', { isActive: 'true' }).subscribe({
      next: (res) => this.clients.set(res.data || []),
    });
  }

  loadSupervisors() {
    this.api.get<any>('users', { isActive: 'true' }).subscribe({
      next: (res) => this.supervisors.set(res.data || []),
    });
  }

  loadProject(id: string) {
    this.loading.set(true);
    this.service.getOne(id).subscribe({
      next: (res) => {
        const p = res.data;
        this.formData = {
          name: p.name,
          code: p.code,
          address: p.address || '',
          clientId: p.clientId || '',
          supervisorId: p.supervisorId || '',
          status: p.status,
          startDate: p.startDate ? p.startDate.substring(0, 10) : '',
          estimatedEndDate: p.estimatedEndDate ? p.estimatedEndDate.substring(0, 10) : '',
          budget: p.budget || '',
          notes: p.notes || '',
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save() {
    if (this.saving() || !this.formData.name.trim() || !this.formData.code.trim()) return;
    this.saving.set(true);

    const payload: any = { ...this.formData };
    // Limpiar campos vacíos
    if (!payload.clientId) delete payload.clientId;
    if (!payload.supervisorId) delete payload.supervisorId;
    if (!payload.startDate) delete payload.startDate;
    if (!payload.estimatedEndDate) delete payload.estimatedEndDate;
    if (!payload.budget) delete payload.budget;
    if (!payload.address) delete payload.address;
    if (!payload.notes) delete payload.notes;

    const req = this.isEdit()
      ? this.service.update(this.editId(), payload)
      : this.service.create(payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.router.navigate(['/projects']); },
      error: (err: any) => {
        alert(err.error?.message || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }

  cancel() { this.router.navigate(['/projects']); }
}