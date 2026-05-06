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
import { ApiService } from '../../../core/services/api.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl:'./suppliers.html',
  styleUrls: ['./suppliers.css']
})
export class Suppliers implements OnInit {
  private api = inject(ApiService);
  roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  showInactive = signal(false);
  editingId = signal('');
  formData = { name: '', taxId: '', email: '', phone: '', address: '' };
  columns = ['name', 'taxId', 'email', 'phone', 'status', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (!this.showInactive()) params.isActive = 'true';
    this.api.get<any>('suppliers', params).subscribe({
      next: (res) => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleInactive() {
    this.showInactive.set(!this.showInactive());
    this.load();
  }

  openForm() {
    this.formData = { name: '', taxId: '', email: '', phone: '', address: '' };
    this.editingId.set('');
    this.showForm.set(true);
  }

  cancel() { this.showForm.set(false); this.editingId.set(''); }

  edit(item: any) {
    this.formData = {
      name: item.name, taxId: item.taxId || '',
      email: item.email || '', phone: item.phone || '', address: item.address || '',
    };
    this.editingId.set(item.id);
    this.showForm.set(true);
  }

  save() {
    if (this.saving() || !this.formData.name.trim()) return;
    this.saving.set(true);
    const req = this.editingId()
      ? this.api.patch(`suppliers/${this.editingId()}`, this.formData)
      : this.api.post('suppliers', this.formData);
    req.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  toggleActive(item: any) {
    const action = item.isActive ? 'inhabilitar' : 'habilitar';
    if (!confirm(`¿Deseas ${action} al proveedor "${item.name}"?`)) return;
    this.api.patch(`suppliers/${item.id}`, { isActive: !item.isActive }).subscribe({
      next: () => this.load(),
    });
  }

  permanentDelete(id: string) {
    if (!confirm('¿Eliminar este proveedor permanentemente? Esta acción no se puede deshacer.')) return;
    this.api.delete(`suppliers/${id}/permanent`).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.data?.message || 'No se puede eliminar este proveedor'),
    });
  }
}