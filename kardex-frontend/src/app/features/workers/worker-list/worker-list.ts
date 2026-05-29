import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { WorkersService } from '../../../core/services/workers.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-worker-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule,
  ],
  templateUrl: './worker-list.html',
  styleUrls: ['./worker-list.css'],
})
export class WorkerList implements OnInit {
  private service = inject(WorkersService);
  roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  showInactive = signal(false);
  editingId = signal('');

  columns = ['fullName', 'idNumber', 'workerRole', 'dailyRate', 'phone', 'status', 'actions'];

  roleOptions = [
    { value: 'MAESTRO_MAYOR', label: 'Maestro Mayor' },
    { value: 'ALBANIL', label: 'Albañil' },
    { value: 'AYUDANTE', label: 'Ayudante' },
    { value: 'ELECTRICISTA', label: 'Electricista' },
    { value: 'PLOMERO', label: 'Plomero' },
    { value: 'CARPINTERO', label: 'Carpintero' },
    { value: 'FIERRERO', label: 'Fierrero' },
    { value: 'PINTOR', label: 'Pintor' },
    { value: 'CHOFER', label: 'Chofer' },
    { value: 'GUARDIA', label: 'Guardia' },
  ];

  roleLabels: Record<string, string> = {
    MAESTRO_MAYOR: 'Maestro Mayor', ALBANIL: 'Albañil', AYUDANTE: 'Ayudante',
    ELECTRICISTA: 'Electricista', PLOMERO: 'Plomero', CARPINTERO: 'Carpintero',
    FIERRERO: 'Fierrero', PINTOR: 'Pintor', CHOFER: 'Chofer', GUARDIA: 'Guardia',
  };

  formData = {
    fullName: '', idNumber: '', workerRole: '', dailyRate: '', phone: '',
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (!this.showInactive()) params.isActive = 'true';
    this.service.getAll(params).subscribe({
      next: (res) => { this.items.set(res.data?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleInactive() { this.showInactive.set(!this.showInactive()); this.load(); }

  openForm() {
    this.formData = { fullName: '', idNumber: '', workerRole: '', dailyRate: '', phone: '' };
    this.editingId.set('');
    this.showForm.set(true);
  }

  edit(item: any) {
    this.formData = {
      fullName: item.fullName, idNumber: item.idNumber || '',
      workerRole: item.workerRole, dailyRate: item.dailyRate, phone: item.phone || '',
    };
    this.editingId.set(item.id);
    this.showForm.set(true);
  }

  cancel() { this.showForm.set(false); this.editingId.set(''); }

  save() {
    if (this.saving() || !this.formData.fullName.trim() || !this.formData.workerRole || !this.formData.dailyRate) return;
    this.saving.set(true);

    const payload: any = { ...this.formData };
    if (!payload.idNumber) delete payload.idNumber;
    if (!payload.phone) delete payload.phone;

    const req = this.editingId()
      ? this.service.update(this.editingId(), payload)
      : this.service.create(payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: (err: any) => {
        alert(err.error?.message || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }

  toggleActive(item: any) {
    const action = item.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${action} a "${item.fullName}"?`)) return;
    const req = item.isActive ? this.service.deactivate(item.id) : this.service.activate(item.id);
    req.subscribe({ next: () => this.load() });
  }

  permanentDelete(item: any) {
    if (!confirm(`¿Eliminar a "${item.fullName}" permanentemente?`)) return;
    this.service.permanentDelete(item.id).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.message || 'No se puede eliminar este trabajador'),
    });
  }
}