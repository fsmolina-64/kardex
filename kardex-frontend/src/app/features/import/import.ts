import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-import',
    standalone: true,
    imports: [
        CommonModule, MatCardModule, MatButtonModule, MatIconModule,
        MatProgressSpinnerModule, MatTabsModule, MatTableModule,
    ],
    templateUrl: './import.html',
    styleUrls: ['./import.css'],
})
export class Import {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    uploadingProducts = signal(false);
    productResult = signal<any>(null);
    productFile = signal<File | null>(null);

    uploadingWorkers = signal(false);
    workerResult = signal<any>(null);
    workerFile = signal<File | null>(null);

    errorColumns = ['fila', 'error'];

    downloadProductTemplate() {
        window.open(`${this.apiUrl}/import/template/products`, '_blank');
    }

    downloadWorkerTemplate() {
        window.open(`${this.apiUrl}/import/template/workers`, '_blank');
    }

    onProductFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.productFile.set(input.files[0]);
            this.productResult.set(null);
        }
    }

    onWorkerFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.workerFile.set(input.files[0]);
            this.workerResult.set(null);
        }
    }

    importProducts() {
        const file = this.productFile();
        if (!file || this.uploadingProducts()) return;

        this.uploadingProducts.set(true);
        const formData = new FormData();
        formData.append('file', file);

        this.http.post<any>(`${this.apiUrl}/import/products`, formData).subscribe({
            next: (res) => {
                this.productResult.set(res.data);
                this.uploadingProducts.set(false);
            },
            error: (err) => {
                this.productResult.set({ created: 0, skipped: 0, errors: [{ fila: '-', error: err.error?.message || 'Error al importar' }] });
                this.uploadingProducts.set(false);
            },
        });
    }

    importWorkers() {
        const file = this.workerFile();
        if (!file || this.uploadingWorkers()) return;

        this.uploadingWorkers.set(true);
        const formData = new FormData();
        formData.append('file', file);

        this.http.post<any>(`${this.apiUrl}/import/workers`, formData).subscribe({
            next: (res) => {
                this.workerResult.set(res.data);
                this.uploadingWorkers.set(false);
            },
            error: (err) => {
                this.workerResult.set({ created: 0, skipped: 0, errors: [{ fila: '-', error: err.error?.message || 'Error al importar' }] });
                this.uploadingWorkers.set(false);
            },
        });
    }
}