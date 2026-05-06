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
import { ApiService } from '../../../core/services/api.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule,
  ],
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
})
export class Categories implements OnInit {
  private api = inject(ApiService);
  roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal('');
  formName = '';
  formDescription = '';
  columns = ['name', 'description', 'products', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<any>('categories').subscribe({
      next: (res) => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.formName = '';
    this.formDescription = '';
    this.editingId.set('');
    this.showForm.set(true);
  }

  cancel() { this.showForm.set(false); this.editingId.set(''); }

  edit(item: any) {
    this.formName = item.name;
    this.formDescription = item.description || '';
    this.editingId.set(item.id);
    this.showForm.set(true);
  }

  save() {
    if (this.saving() || !this.formName.trim()) return;
    this.saving.set(true);
    const data = { name: this.formName.trim(), description: this.formDescription.trim() };
    const req = this.editingId()
      ? this.api.patch(`categories/${this.editingId()}`, data)
      : this.api.post('categories', data);
    req.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  remove(id: string) {
    if (!id) return;
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.api.delete(`categories/${id}`).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.data?.message || 'No se puede eliminar'),
    });
  }
}