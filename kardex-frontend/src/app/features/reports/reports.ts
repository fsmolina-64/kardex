import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { PdfService } from '../../core/services/pdf.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatTabsModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl:'./reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit {
  private api = inject(ApiService);
  private pdf = inject(PdfService);
  private cdr = inject(ChangeDetectorRef);

  stock = signal<any[]>([]);
  lowStock = signal<any[]>([]);
  valuation = signal<any>(null);
  warehouses = signal<any[]>([]);
  stockWarehouse = '';
  loadingStock = signal(false);
  loadingLow = signal(false);
  loadingVal = signal(false);

  stockColumns = ['product', 'code', 'category', 'warehouse', 'quantity', 'avgCost', 'total'];
  lowColumns = ['product', 'warehouse', 'current', 'min'];
  valColumns = ['product', 'qty', 'cost', 'total'];

  ngOnInit() {
    this.api.get<any>('warehouses', { isActive: 'true' }).subscribe({
      next: (res) => { this.warehouses.set(res.data); this.cdr.detectChanges(); }
    });
    this.loadStock();
    this.loadLow();
    this.loadValuation();
  }

  loadStock() {
    this.loadingStock.set(true);
    const params: any = {};
    if (this.stockWarehouse) params.warehouseId = this.stockWarehouse;
    this.api.get<any>('reports/current-stock', params).subscribe({
      next: (res) => { this.stock.set(res.data); this.loadingStock.set(false); this.cdr.detectChanges(); },
      error: () => { this.loadingStock.set(false); this.cdr.detectChanges(); },
    });
  }

  loadLow() {
    this.loadingLow.set(true);
    this.api.get<any>('reports/low-stock').subscribe({
      next: (res) => { this.lowStock.set(res.data); this.loadingLow.set(false); this.cdr.detectChanges(); },
      error: () => { this.loadingLow.set(false); this.cdr.detectChanges(); },
    });
  }

  loadValuation() {
    this.loadingVal.set(true);
    this.api.get<any>('reports/valuation').subscribe({
      next: (res) => { this.valuation.set(res.data); this.loadingVal.set(false); this.cdr.detectChanges(); },
      error: () => { this.loadingVal.set(false); this.cdr.detectChanges(); },
    });
  }

  getTotalValue(): number {
    return this.stock().reduce((sum, i) => sum + Number(i.quantity) * Number(i.avgCost), 0);
  }

  pdfStock() {
    this.pdf.generateStockReport(this.stock(), 'STOCK ACTUAL');
  }

  pdfLowStock() {
    this.pdf.generateStockReport(this.lowStock(), 'STOCK BAJO MÍNIMO',
      'Estos productos requieren reposición urgente.');
  }

  pdfValuation() {
    this.pdf.generateStockReport(this.valuation()?.items || [], 'VALORACIÓN DE INVENTARIO',
      `Valor total del inventario: $${Number(this.valuation()?.totalValue || 0).toFixed(2)}`);
  }
}