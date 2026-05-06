import { Component, OnInit } from '@angular/core';
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
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl:'./entry-form.html',
  styleUrls: ['./entry-form.css']
})
export class EntryForm implements OnInit {
  form: FormGroup;
  loading = false;
  warehouses: any[] = [];
  suppliers: any[] = [];
  products: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
  ) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

    this.form = this.fb.group({
      documentType: ['FACTURA_COMPRA', Validators.required],
      movementDate: [localDate, Validators.required],
      warehouseId: ['', Validators.required],
      supplierId: [''],
      notes: [''],
      details: this.fb.array([]),
    });
  }

  ngOnInit() {
this.api.get<any>('warehouses', { isActive: 'true' }).subscribe(res => this.warehouses = res.data);

this.api.get<any>('suppliers', { isActive: 'true' }).subscribe(res => this.suppliers = res.data);
    this.api.get<any>('products', { isActive: true }).subscribe(
      res => this.products = res.data.data || []
    );
  }

  get details() { return this.form.get('details') as FormArray; }

  addDetail() {
    this.details.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      totalCost: [{ value: '0.00', disabled: true }],
    }));
  }

  removeDetail(i: number) { this.details.removeAt(i); }

  onProductSelect(i: number) {
    const detail = this.details.at(i);
    const productId = detail.get('productId')?.value;
    const product = this.products.find(p => p.id === productId);
    if (product) {
      detail.get('unitCost')?.setValue(Number(product.costPrice));
      this.calcTotal(i);
    }
  }

  getUnit(i: number): string {
    const productId = this.details.at(i).get('productId')?.value;
    const product = this.products.find(p => p.id === productId);
    return product?.unit?.abbreviation || '';
  }

  calcTotal(i: number) {
    const detail = this.details.at(i);
    const qty = Number(detail.get('quantity')?.value || 0);
    const cost = Number(detail.get('unitCost')?.value || 0);
    detail.get('totalCost')?.setValue((qty * cost).toFixed(2));
  }

  getGrandTotal(): number {
    return this.details.controls.reduce((sum, d) => {
      return sum + Number(d.get('quantity')?.value || 0) * Number(d.get('unitCost')?.value || 0);
    }, 0);
  }

  onSubmit() {
    if (this.form.invalid || this.details.length === 0) return;
    this.loading = true;
    const value = this.form.getRawValue();
    const payload = {
      documentType: value.documentType,
      movementDate: value.movementDate,
      warehouseId: value.warehouseId,
      supplierId: value.supplierId || undefined,
      notes: value.notes,
      details: value.details.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        unitCost: Number(d.unitCost),
      })),
    };
    this.api.post('movements/entry', payload).subscribe({
      next: () => this.router.navigate(['/movements']),
      error: (err: any) => {
        alert(err.error?.data?.message || 'Error al registrar la entrada');
        this.loading = false;
      },
    });
  }
}