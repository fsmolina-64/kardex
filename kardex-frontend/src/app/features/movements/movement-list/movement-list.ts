import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { PdfService } from '../../../core/services/pdf.service';
import { AuthRoleService } from '../../../core/services/auth-role.service';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatTooltipModule,MatInputModule
  ],
  templateUrl:'./movement-list.html',
  styleUrls: ['./movement-list.css']
})
export class MovementList implements OnInit {
  private api = inject(ApiService);
  private pdf = inject(PdfService);
  roles = inject(AuthRoleService);

  movements = signal<any[]>([]);
  loading = signal(false);
  filterType = '';
  filterFrom = '';
  filterTo = '';
  columns = ['reference', 'type', 'document', 'warehouse', 'user', 'date', 'total', 'status'];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = { limit: 500 };
    if (this.filterType) params.type = this.filterType;
    if (this.filterFrom) params.from = this.filterFrom;
    if (this.filterTo) params.to = this.filterTo;
    this.api.get<any>('movements', params).subscribe({
      next: (res) => { this.movements.set(res.data.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportPdf() {
    this.pdf.generateMovements(this.movements(), {
      type: this.filterType,
      from: this.filterFrom,
      to: this.filterTo,
    });
  }

  getTotal(m: any): number {
    return m.details?.reduce((s: number, d: any) => s + Number(d.totalCost), 0) ?? 0;
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      ENTRADA: 'Entrada', SALIDA: 'Salida', TRASLADO: 'Traslado',
      AJUSTE_POSITIVO: 'Ajuste +', AJUSTE_NEGATIVO: 'Ajuste -',
      DEVOLUCION_COMPRA: 'Dev. Compra', DEVOLUCION_VENTA: 'Dev. Venta',
    };
    return labels[type] || type;
  }

  getDocLabel(doc: string): string {
    const labels: any = {
      FACTURA_COMPRA: 'Factura compra', FACTURA_VENTA: 'Factura venta',
      NOTA_ENTREGA: 'Nota entrega', PRESTAMO: 'Préstamo',
      DEVOLUCION_COMPRA: 'Dev. compra', DEVOLUCION_VENTA: 'Dev. venta',
      CONSUMO_INTERNO: 'Consumo interno', AJUSTE: 'Ajuste',
    };
    return labels[doc] || doc || '-';
  }

  getTypeClass(type: string): string {
    if (type === 'ENTRADA' || type === 'DEVOLUCION_VENTA') return 'badge-entrada';
    if (type === 'SALIDA' || type === 'DEVOLUCION_COMPRA') return 'badge-salida';
    if (type === 'TRASLADO') return 'badge-traslado';
    return 'badge-ajuste';
  }

  getStatusClass(status: string): string {
    const map: any = { CONFIRMED: 'badge-confirmed', DRAFT: 'badge-draft', CANCELLED: 'badge-cancelled' };
    return map[status] || '';
  }
}