import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class WorkersService {
  private api = inject(ApiService);

  getAll(params?: any) {
    return this.api.get<any>('workers', params);
  }

  getOne(id: string) {
    return this.api.get<any>(`workers/${id}`);
  }

  create(data: any) {
    return this.api.post<any>('workers', data);
  }

  update(id: string, data: any) {
    return this.api.patch<any>(`workers/${id}`, data);
  }

  deactivate(id: string) {
    return this.api.patch<any>(`workers/${id}/deactivate`, {});
  }

  activate(id: string) {
    return this.api.patch<any>(`workers/${id}/activate`, {});
  }

  permanentDelete(id: string) {
    return this.api.delete<any>(`workers/${id}/permanent`);
  }
}