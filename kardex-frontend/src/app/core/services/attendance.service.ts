import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private api = inject(ApiService);

  getAll(params?: any) {
    return this.api.get<any>('attendance', params);
  }

  getReport(params: { projectId: string; from?: string; to?: string }) {
    return this.api.get<any>('attendance/report', params);
  }

  create(data: any) {
    return this.api.post<any>('attendance', data);
  }

  bulkCreate(data: any) {
    return this.api.post<any>('attendance/bulk', data);
  }

  update(id: string, data: any) {
    return this.api.patch<any>(`attendance/${id}`, data);
  }

  remove(id: string) {
    return this.api.delete<any>(`attendance/${id}`);
  }
}