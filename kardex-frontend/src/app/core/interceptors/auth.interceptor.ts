import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y NO es logout ni login ni refresh → limpiar sesión
      const isAuthEndpoint = req.url.includes('/auth/logout')
        || req.url.includes('/auth/login')
        || req.url.includes('/auth/refresh');

      if (error.status === 401 && !isAuthEndpoint) {
        localStorage.clear();
        window.location.href = '/auth/login';
      }

      return throwError(() => error);
    })
  );
};