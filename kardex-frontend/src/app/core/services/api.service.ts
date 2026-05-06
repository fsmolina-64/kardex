import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: any) {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ success: boolean; data: T }>(
      `${this.apiUrl}/${path}`, { params: httpParams }
    );
  }

  post<T>(path: string, body: any) {
    return this.http.post<{ success: boolean; data: T }>(
      `${this.apiUrl}/${path}`, body
    );
  }

  patch<T>(path: string, body: any) {
    return this.http.patch<{ success: boolean; data: T }>(
      `${this.apiUrl}/${path}`, body
    );
  }

  delete<T>(path: string) {
    return this.http.delete<{ success: boolean; data: T }>(
      `${this.apiUrl}/${path}`
    );
  }
}