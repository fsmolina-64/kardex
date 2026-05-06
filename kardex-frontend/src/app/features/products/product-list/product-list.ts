import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { PdfService } from '../../../core/services/pdf.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl:'./product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductList implements OnInit {
  private api = inject(ApiService);
  private pdf = inject(PdfService);
  roles = inject(AuthRoleService);

  products = signal<any[]>([]);
  loading = signal(false);
  showInactive = signal(false);
  search = '';
  columns = ['code', 'name', 'category', 'unit', 'stock', 'costPrice', 'salePrice', 'status', 'actions'];
  private searchTimeout: any;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = { search: this.search };
    if (!this.showInactive()) params.isActive = 'true';
    this.api.get<any>('products', params).subscribe({
      next: (res) => { this.products.set(res.data.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleInactive() {
    this.showInactive.set(!this.showInactive());
    this.load();
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 400);
  }

  getTotalStock(product: any): number {
    return product.inventory?.reduce((sum: number, i: any) => sum + Number(i.quantity), 0) ?? 0;
  }

  exportPdf() {
    this.pdf.generateProducts(this.products(), {
      search: this.search,
      status: this.showInactive() ? 'Todos' : 'Solo activos',
    });
  }

  deactivate(product: any) {
    if (!confirm(`¿Desactivar "${product.name}"?`)) return;
    this.api.patch(`products/${product.id}/deactivate`, {}).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.data?.message || 'Error al desactivar'),
    });
  }

  activate(product: any) {
    if (!confirm(`¿Activar "${product.name}"?`)) return;
    this.api.patch(`products/${product.id}/activate`, {}).subscribe({
      next: () => this.load(),
    });
  }

  permanentDelete(product: any) {
    if (!confirm(`¿Eliminar permanentemente "${product.name}"?\nSolo es posible si no tiene movimientos.`)) return;
    this.api.delete(`products/${product.id}/permanent`).subscribe({
      next: () => this.load(),
      error: (err: any) => alert(err.error?.data?.message || 'No se puede eliminar'),
    });
  }
}