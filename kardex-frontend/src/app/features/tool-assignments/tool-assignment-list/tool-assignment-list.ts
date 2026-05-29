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
import { MatDialogModule } from '@angular/material/dialog';
import { ToolAssignmentsService } from '../../../core/services/tool-assignments.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-tool-assignment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule, MatDialogModule,
  ],
  templateUrl: './tool-assignment-list.html',
  styleUrls: ['./tool-assignment-list.css'],
})
export class ToolAssignmentList implements OnInit {
  private service = inject(ToolAssignmentsService);
  private projectsService = inject(ProjectsService);
  private api = inject(ApiService);
  roles = inject(AuthRoleService);

  items = signal<any[]>([]);
  projects = signal<any[]>([]);
  products = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  showReturnForm = signal(false);
  returningId = signal('');

  filterProjectId = signal('');
  filterStatus = signal('');

  columns = ['product', 'project', 'assignedDate', 'quantity', 'status', 'returnedDate', 'actions'];

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'ASSIGNED', label: 'Asignado' },
    { value: 'RETURNED', label: 'Devuelto' },
    { value: 'LOST', label: 'Perdido' },
    { value: 'DAMAGED', label: 'Dañado' },
  ];

  statusLabels: Record<string, string> = {
    ASSIGNED: 'Asignado', RETURNED: 'Devuelto',
    LOST: 'Perdido', DAMAGED: 'Dañado',
  };

  statusColors: Record<string, string> = {
    ASSIGNED: 'assigned', RETURNED: 'returned',
    LOST: 'lost', DAMAGED: 'damaged',
  };

  formData = {
    productId: '', projectId: '', assignedDate: new Date().toISOString().substring(0, 10),
    quantity: '1', notes: '',
  };

  returnData = { returnedDate: new Date().toISOString().substring(0, 10), notes: '' };

  ngOnInit() {
    this.loadProjects();
    this.loadProducts();
    this.load();
  }

  loadProjects() {
    this.projectsService.getAll({ isActive: 'true' }).subscribe({
      next: (res) => this.projects.set(res.data?.data || []),
    });
  }

  loadProducts() {
    this.api.get<any>('products', { isActive: 'true', limit: 200 }).subscribe({
      next: (res) => {
        const all = res.data?.data || [];
        this.products.set(all.filter((p: any) => p.productType === 'TOOL' || p.productType === 'MACHINERY'));
      },
    });
  }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (this.filterProjectId()) params.projectId = this.filterProjectId();
    if (this.filterStatus()) params.status = this.filterStatus();

    this.service.getAll(params).subscribe({
      next: (res) => { this.items.set(res.data?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.formData = {
      productId: '', projectId: '', notes: '', quantity: '1',
      assignedDate: new Date().toISOString().substring(0, 10),
    };
    this.showForm.set(true);
  }

  cancel() { this.showForm.set(false); this.showReturnForm.set(false); this.returningId.set(''); }

  save() {
    if (this.saving() || !this.formData.productId || !this.formData.projectId) return;
    this.saving.set(true);
    const payload: any = { ...this.formData };
    if (!payload.notes) delete payload.notes;

    this.service.create(payload).subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: (err: any) => { alert(err.error?.message || 'Error al asignar'); this.saving.set(false); },
    });
  }

  openReturn(item: any) {
    this.returningId.set(item.id);
    this.returnData = { returnedDate: new Date().toISOString().substring(0, 10), notes: '' };
    this.showReturnForm.set(true);
  }

  confirmReturn() {
    if (this.saving()) return;
    this.saving.set(true);
    this.service.return(this.returningId(), this.returnData).subscribe({
      next: () => { this.saving.set(false); this.cancel(); this.load(); },
      error: (err: any) => { alert(err.error?.message || 'Error al devolver'); this.saving.set(false); },
    });
  }

  changeStatus(item: any, status: string) {
    if (!confirm(`¿Marcar herramienta como ${this.statusLabels[status]}?`)) return;
    this.service.changeStatus(item.id, { status }).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.message || 'Error al cambiar estado'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar asignación de "${item.product?.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.message || 'No se puede eliminar'),
    });
  }
}