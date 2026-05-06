import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { PdfService } from '../../core/services/pdf.service';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatInputModule, MatSelectModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl:'./kardex.html',
  styleUrls: ['./kardex.css']
})
export class Kardex implements OnInit {
  private api = inject(ApiService);
  private pdf = inject(PdfService);

  entries = signal<any[]>([]);
  products = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  loading = signal(false);

  filterProductId = '';
  filterWarehouseId = '';
  filterFrom = '';
  filterTo = '';

  columns = ['date', 'product', 'warehouse', 'type',
    'inQty', 'inCost', 'inTotal',
    'outQty', 'outCost', 'outTotal',
    'balQty', 'balCost', 'balTotal'];

  ngOnInit() {
    this.api.get<any>('products', { isActive: 'true' }).subscribe(
      res => this.products.set(res.data.data || [])
    );
    this.api.get<any>('warehouses', { isActive: 'true' }).subscribe(
      res => this.warehouses.set(res.data)
    );
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: any = { limit: 500 };
    if (this.filterProductId) params.productId = this.filterProductId;
    if (this.filterWarehouseId) params.warehouseId = this.filterWarehouseId;
    if (this.filterFrom) params.from = this.filterFrom;
    if (this.filterTo) params.to = this.filterTo;
    this.api.get<any>('kardex', params).subscribe({
      next: (res) => { this.entries.set(res.data.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportPdf() {
    const productName = this.products().find(p => p.id === this.filterProductId)?.name;
    const warehouseName = this.warehouses().find(w => w.id === this.filterWarehouseId)?.name;
    this.pdf.generateKardex(this.entries(), {
      product: productName,
      warehouse: warehouseName,
      from: this.filterFrom,
      to: this.filterTo,
    });
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      ENTRADA: 'Entrada', SALIDA: 'Salida', TRASLADO: 'Traslado',
      AJUSTE_POSITIVO: 'Ajuste +', AJUSTE_NEGATIVO: 'Ajuste -',
      DEVOLUCION_COMPRA: 'Dev. Compra', DEVOLUCION_VENTA: 'Dev. Venta',
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    if (type === 'ENTRADA' || type === 'DEVOLUCION_VENTA') return 'badge-entrada';
    if (type === 'SALIDA' || type === 'DEVOLUCION_COMPRA') return 'badge-salida';
    if (type === 'TRASLADO') return 'badge-traslado';
    return 'badge-ajuste';
  }
}