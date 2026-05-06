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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatTooltipModule,
  ],
  templateUrl:'./warehouses.html',
  styleUrls: ['./warehouses.css']
})
export class Warehouses implements OnInit {
  private api = inject(ApiService);
    roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  showInactive = signal(false);
  editingId = signal('');
  formData = { name: '', code: '', location: '', isMain: false };
  columns = ['name', 'code', 'location', 'status', 'actions'];

  ngOnInit() { this.load(); }

load() {
  this.loading.set(true);
  const params: any = {};
  if (!this.showInactive()) {
    params.isActive = 'true';
  }


  this.api.get<any>('warehouses', params).subscribe({
    next: (res) => { this.items.set(res.data); this.loading.set(false); },
    error: () => this.loading.set(false),
  });
}

  openForm() {
    this.formData = { name: '', code: '', location: '', isMain: false };
    this.editingId.set('');
    this.showForm.set(true);
  }

  cancel() { this.showForm.set(false); this.editingId.set(''); }

  edit(item: any) {
    this.formData = {
      name: item.name, code: item.code,
      location: item.location || '', isMain: item.isMain,
    };
    this.editingId.set(item.id);
    this.showForm.set(true);
  }

  save() {
    if (this.saving() || !this.formData.name.trim()) return;
    this.saving.set(true);
    const req = this.editingId()
      ? this.api.patch(`warehouses/${this.editingId()}`, this.formData)
      : this.api.post('warehouses', this.formData);
    req.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => this.saving.set(false),
    });
  }

toggleActive(item: any) {
  const action = item.isActive ? 'desactivar' : 'activar';
  if (!confirm(`¿Deseas ${action} la bodega "${item.name}"?`)) return;
  this.api.patch(`warehouses/${item.id}`, { isActive: !item.isActive }).subscribe({
    next: () => this.load(),
  });
}

  permanentDelete(id: string) {
    if (!confirm('¿Eliminar esta bodega permanentemente? Esta acción no se puede deshacer.')) return;
    this.api.delete(`warehouses/${id}/permanent`).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.data?.message || 'No se puede eliminar esta bodega'),
    });
  }
}