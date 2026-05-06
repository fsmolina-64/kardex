import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl:'./product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductForm implements OnInit {
  form: FormGroup;
  loading = false;
  isEdit = false;
  productId = '';
  categories: any[] = [];
  units: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      categoryId: ['', Validators.required],
      unitId: ['', Validators.required],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, [Validators.required, Validators.min(0)]],
      minStock: [0],
      valuationMethod: ['AVERAGE'],
      description: [''],
      barcode: [''],
    });
  }

  ngOnInit() {
    this.productId = this.route.snapshot.params['id'];
    this.isEdit = !!this.productId;
    this.loadMasters();
    if (this.isEdit) this.loadProduct();
  }

  loadMasters() {
    this.api.get<any>('categories').subscribe(res => this.categories = res.data);
    this.api.get<any>('units').subscribe(res => this.units = res.data);
  }

  loadProduct() {
    this.api.get<any>(`products/${this.productId}`).subscribe(res => {
      this.form.patchValue(res.data);
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    const value = this.form.value;

    // Limpiar campos opcionales vacíos
    if (!value.barcode) delete value.barcode;
    if (!value.description) delete value.description;

    const req = this.isEdit
      ? this.api.patch(`products/${this.productId}`, value)
      : this.api.post('products', value);

    req.subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err: any) => {
        alert(err.error?.data?.message || 'Error al guardar el producto');
        this.loading = false;
      },
    });
  }
}