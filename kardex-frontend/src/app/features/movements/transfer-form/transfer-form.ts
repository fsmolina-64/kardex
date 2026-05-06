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
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl:'./transfer-form.html',
  styleUrls: ['./transfer-form.css']
})
export class TransferForm implements OnInit {
  form: FormGroup;
  loading = false;
  warehouses: any[] = [];
  products: any[] = [];

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {
    this.form = this.fb.group({
      warehouseId: ['', Validators.required],
      warehouseDestId: ['', Validators.required],
      notes: [''],
      details: this.fb.array([]),
    });
  }

  ngOnInit() {
this.api.get<any>('warehouses', { isActive: 'true' }).subscribe(res => this.warehouses = res.data);
    this.api.get<any>('products', { isActive: true }).subscribe(res => this.products = res.data.data || []);
  }

  get details() { return this.form.get('details') as FormArray; }

  addDetail() {
    this.details.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
    }));
  }

  removeDetail(i: number) { this.details.removeAt(i); }

  onSubmit() {
    if (this.form.invalid || this.details.length === 0) return;
    this.loading = true;
    const value = this.form.getRawValue();
    this.api.post('movements/transfer', value).subscribe({
      next: () => this.router.navigate(['/movements']),
      error: () => this.loading = false,
    });
  }
}