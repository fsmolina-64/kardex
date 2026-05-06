import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule, MatSlideToggleModule,
  ],
  templateUrl: "./users.html",
  styleUrls: ["./users.css"],
})
export class Users implements OnInit {
  private api = inject(ApiService);

  users = signal<any[]>([]);
  roles = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  showInactive = signal(false);
  editingId = signal('');

  formFullName = '';
  formEmail = '';
  formPassword = '';
  formRoleIds: string[] = [];

  columns = ['name', 'email', 'roles', 'status', 'actions'];

  filteredUsers = () => {
    return this.showInactive()
      ? this.users()
      : this.users().filter(u => u.isActive);
  };

  ngOnInit() {
    this.load();
    this.loadRoles();
  }

  load() {
    this.loading.set(true);
    this.api.get<any>('users').subscribe({
      next: (res) => { this.users.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadRoles() {
    this.api.get<any>('roles').subscribe({
      next: (res) => this.roles.set(res.data),
    });
  }

  openForm() {
    this.formFullName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formRoleIds = [];
    this.editingId.set('');
    this.showForm.set(true);
  }

  cancel() {
    this.showForm.set(false);
    this.editingId.set('');
  }

  edit(user: any) {
    this.formFullName = user.fullName;
    this.formEmail = user.email;
    this.formPassword = '';
    this.formRoleIds = user.userRoles?.map((ur: any) => ur.roleId) || [];
    this.editingId.set(user.id);
    this.showForm.set(true);
  }

  save() {
    if (this.saving()) return;
    this.saving.set(true);

    const req = this.editingId()
      ? this.api.patch(`users/${this.editingId()}`, {
          fullName: this.formFullName,
          email: this.formEmail,
          roleIds: this.formRoleIds,
        })
      : this.api.post('users', {
          fullName: this.formFullName,
          email: this.formEmail,
          password: this.formPassword,
          roleIds: this.formRoleIds,
        });

    req.subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: (err: any) => {
        this.saving.set(false);
        alert(err.error?.data?.message || 'Error al guardar');
      },
    });
  }

  toggleActive(user: any) {
    const action = user.isActive ? 'inhabilitar' : 'habilitar';
    if (!confirm(`¿Deseas ${action} a ${user.fullName}?`)) return;
    this.api.patch(`users/${user.id}`, { isActive: !user.isActive }).subscribe({
      next: () => this.load(),
    });
  }

deleteUser(id: string) {
  if (!confirm('¿Eliminar este usuario permanentemente? Esta acción no se puede deshacer.')) return;
  this.api.delete(`users/${id}/permanent`).subscribe({
    next: () => this.load(),
    error: (err: any) => alert(err.error?.data?.message || 'Error al eliminar'),
  });
}
}