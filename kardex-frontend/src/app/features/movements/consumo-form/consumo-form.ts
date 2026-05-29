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
import { ApiService } from '../../../core/services/api.service';

interface ConsumoRow {
  productId: string;
  productName: string;
  productCode: string;
  availableQty: number;
  unit: string;
  avgCost: number;
  quantity: number;
}

@Component({
  selector: 'app-consumo-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule, MatTableModule, MatTooltipModule,
  ],
  templateUrl: './consumo-form.html',
  styleUrls: ['./consumo-form.css'],
})
export class ConsumoForm implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  projects = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  products = signal<any[]>([]);
  saving = signal(false);

  selectedProjectId = signal('');
  selectedWarehouseId = signal('');
  selectedDate = signal(new Date().toISOString().substring(0, 10));
  documentNumber = signal('');
  notes = signal('');

  rows = signal<ConsumoRow[]>([]);
  selectedProductId = signal('');

  columns = ['code', 'name', 'available', 'unit', 'cost', 'quantity', 'total', 'remove'];

  ngOnInit() {
    this.loadProjects();
    this.loadWarehouses();
  }

  loadProjects() {
    this.api.get<any>('projects', { isActive: 'true', status: 'ACTIVE' }).subscribe({
      next: (res) => this.projects.set(res.data?.data || []),
    });
  }

  loadWarehouses() {
    this.api.get<any>('warehouses', { isActive: 'true' }).subscribe({
      next: (res) => this.warehouses.set(res.data || []),
    });
  }

  loadProducts() {
    if (!this.selectedWarehouseId()) return;
    this.api.get<any>('products', { isActive: 'true', limit: 200 }).subscribe({
      next: (res) => {
        const all = res.data?.data || [];
        this.products.set(all.filter((p: any) =>
          p.productType === 'MATERIAL' || p.productType === 'CONSUMABLE'
        ));
      },
    });
  }

  onWarehouseChange() { this.loadProducts(); this.rows.set([]); }

  addProduct() {
    if (!this.selectedProductId() || !this.selectedWarehouseId()) return;

    const alreadyAdded = this.rows().find(r => r.productId === this.selectedProductId());
    if (alreadyAdded) { alert('Producto ya agregado'); return; }

    const product = this.products().find(p => p.id === this.selectedProductId());
    if (!product) return;

    // Buscar stock disponible
    this.api.get<any>(`reports/current-stock`, { warehouseId: this.selectedWarehouseId() }).subscribe({
      next: (res) => {
        const stockList = res.data || [];
        const stock = stockList.find((s: any) => s.productId === product.id);
        const availableQty = stock ? Number(stock.quantity) : 0;
        const avgCost = stock ? Number(stock.avgCost) : 0;

        this.rows.update(rows => [...rows, {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          availableQty,
          unit: product.unit?.abbreviation || '',
          avgCost,
          quantity: 1,
        }]);
        this.selectedProductId.set('');
      },
    });
  }

  removeRow(productId: string) {
    this.rows.update(rows => rows.filter(r => r.productId !== productId));
  }

  totalCost(): number {
    return this.rows().reduce((sum, r) => sum + (r.quantity * r.avgCost), 0);
  }

  canSave(): boolean {
    return !!this.selectedProjectId() &&
      !!this.selectedWarehouseId() &&
      this.rows().length > 0 &&
      this.rows().every(r => r.quantity > 0 && r.quantity <= r.availableQty);
  }

  save() {
    if (this.saving() || !this.canSave()) return;
    this.saving.set(true);

    const payload = {
      projectId: this.selectedProjectId(),
      warehouseId: this.selectedWarehouseId(),
      movementDate: this.selectedDate(),
      documentNumber: this.documentNumber() || undefined,
      notes: this.notes() || undefined,
      details: this.rows().map(r => ({
        productId: r.productId,
        quantity: r.quantity,
      })),
    };

    this.api.post('movements/consumo', payload).subscribe({
      next: () => { this.saving.set(false); this.router.navigate(['/movements']); },
      error: (err: any) => {
        alert(err.error?.message || 'Error al registrar consumo');
        this.saving.set(false);
      },
    });
  }

  cancel() { this.router.navigate(['/movements']); }
}