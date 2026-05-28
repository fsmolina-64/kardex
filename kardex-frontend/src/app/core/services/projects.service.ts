import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private api = inject(ApiService);

  getAll(params?: any) {
    return this.api.get<any>('projects', params);
  }

  getOne(id: string) {
    return this.api.get<any>(`projects/${id}`);
  }

  getSummary(id: string) {
    return this.api.get<any>(`projects/${id}/summary`);
  }

  create(data: any) {
    return this.api.post<any>('projects', data);
  }

  update(id: string, data: any) {
    return this.api.patch<any>(`projects/${id}`, data);
  }

  changeStatus(id: string, status: string) {
    return this.api.patch<any>(`projects/${id}/status`, { status });
  }

  deactivate(id: string) {
    return this.api.patch<any>(`projects/${id}/deactivate`, {});
  }

  activate(id: string) {
    return this.api.patch<any>(`projects/${id}/activate`, {});
  }

  permanentDelete(id: string) {
    return this.api.delete<any>(`projects/${id}/permanent`);
  }
}