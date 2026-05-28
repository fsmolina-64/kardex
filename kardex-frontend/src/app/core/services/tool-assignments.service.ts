import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ToolAssignmentsService {
  private api = inject(ApiService);

  getAll(params?: any) {
    return this.api.get<any>('tool-assignments', params);
  }

  getOne(id: string) {
    return this.api.get<any>(`tool-assignments/${id}`);
  }

  create(data: any) {
    return this.api.post<any>('tool-assignments', data);
  }

  return(id: string, data: { returnedDate: string; notes?: string }) {
    return this.api.patch<any>(`tool-assignments/${id}/return`, data);
  }

  changeStatus(id: string, data: { status: string; notes?: string }) {
    return this.api.patch<any>(`tool-assignments/${id}/status`, data);
  }

  remove(id: string) {
    return this.api.delete<any>(`tool-assignments/${id}`);
  }
}