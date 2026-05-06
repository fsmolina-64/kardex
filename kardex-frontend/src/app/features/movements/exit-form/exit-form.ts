import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-exit-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl:'./exit-form.html',
  styleUrls: ['./exit-form.css']
})
export class ExitForm implements OnInit {
  form: FormGroup;
  loading = false;
  warehouses: any[] = [];
  clients: any[] = [];
  inventoryItems: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    this.form = this.fb.group({
      documentType: ['FACTURA_VENTA', Validators.required],
      movementDate: [localDate, Validators.required],
      warehouseId: ['', Validators.required],
      clientId: [''],
      notes: [''],
      details: this.fb.array([]),
    });
  }

ngOnInit() {
  this.api.get<any>('warehouses', { isActive: 'true' }).subscribe({
    next: (res) => { this.warehouses = res.data; },
  });
  this.api.get<any>('clients', { isActive: 'true' }).subscribe({
    next: (res) => { this.clients = res.data; },
  });
}

  get details() { return this.form.get('details') as FormArray; }

  onWarehouseChange() {
    // Limpiar detalles al cambiar bodega
    while (this.details.length) this.details.removeAt(0);
    const warehouseId = this.form.get('warehouseId')?.value;
    if (!warehouseId) return;

    // Cargar stock de esa bodega
    this.api.get<any>('reports/current-stock', { warehouseId }).subscribe({
      next: (res) => {
        this.inventoryItems = res.data.filter((i: any) => Number(i.quantity) > 0);
        this.cdr.detectChanges();
      }
    });
  }

  addDetail() {
    this.details.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
    }));
  }

  removeDetail(i: number) { this.details.removeAt(i); }

  onProductSelect(i: number) {
    const productId = this.details.at(i).get('productId')?.value;
    const item = this.inventoryItems.find(inv => inv.productId === productId);
    if (item) {
      const maxQty = Number(item.quantity);
      this.details.at(i).get('quantity')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(maxQty),
      ]);
      this.details.at(i).get('quantity')?.updateValueAndValidity();
    }
  }

  getAvailableStock(i: number): number {
    const productId = this.details.at(i).get('productId')?.value;
    const item = this.inventoryItems.find(inv => inv.productId === productId);
    return item ? Number(item.quantity) : 0;
  }

  getUnitCost(i: number): number {
    const productId = this.details.at(i).get('productId')?.value;
    const item = this.inventoryItems.find(inv => inv.productId === productId);
    return item ? Number(item.avgCost) : 0;
  }

  getUnit(i: number): string {
    const productId = this.details.at(i).get('productId')?.value;
    const item = this.inventoryItems.find(inv => inv.productId === productId);
    return item?.product?.unit?.abbreviation || '';
  }

  onSubmit() {
    if (this.form.invalid || this.details.length === 0) return;
    this.loading = true;
    const value = this.form.getRawValue();
    const payload = {
      documentType: value.documentType,
      movementDate: value.movementDate,
      warehouseId: value.warehouseId,
      clientId: value.clientId || undefined,
      notes: value.notes,
      details: value.details.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
      })),
    };
    this.api.post('movements/exit', payload).subscribe({
      next: () => this.router.navigate(['/movements']),
      error: (err: any) => {
        alert(err.error?.data?.message || 'Error al registrar la salida');
        this.loading = false;
      },
    });
  }
}