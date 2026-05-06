import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';

@Injectable()
export class BaseCrudService<T = any> {
  protected resource = '';
  protected api!: ApiService;

  readonly items = signal<T[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  load(params?: any) {
    this.loading.set(true);
    return this.api.get<T[]>(this.resource, params).pipe(
      tap({
        next: (res) => {
          this.items.set((res as any).data || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  create(data: any): Observable<any> {
    this.saving.set(true);
    return this.api.post<T>(this.resource, data).pipe(
      tap({
        next: () => { this.saving.set(false); this.load().subscribe(); },
        error: () => this.saving.set(false),
      })
    );
  }

  update(id: string, data: any): Observable<any> {
    this.saving.set(true);
    return this.api.patch<T>(`${this.resource}/${id}`, data).pipe(
      tap({
        next: () => { this.saving.set(false); this.load().subscribe(); },
        error: () => this.saving.set(false),
      })
    );
  }

  remove(id: string): Observable<any> {
    return this.api.delete<T>(`${this.resource}/${id}`).pipe(
      tap({ next: () => this.load().subscribe() })
    );
  }
}