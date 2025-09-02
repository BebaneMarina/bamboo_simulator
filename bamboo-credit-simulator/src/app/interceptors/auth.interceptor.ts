// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private adminAuth: AdminAuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // Ajouter le token d'authentification si disponible
    const token = this.adminAuth.token;
    
    if (token) {
      req = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expiré ou invalide, déconnecter l'utilisateur
          this.adminAuth.logout().subscribe({
            complete: () => {
              this.router.navigate(['/auth/login']);
            }
          });
        }
        return throwError(() => error);
      })
    );
  }
}