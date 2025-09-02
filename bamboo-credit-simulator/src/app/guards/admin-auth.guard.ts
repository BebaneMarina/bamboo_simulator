// src/app/guards/admin-auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.services';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {

  constructor(
    private adminAuth: AdminAuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.adminAuth.isAuthenticated) {
      return true;
    }

    // Rediriger vers la page de connexion si pas authentifié
    this.router.navigate(['/auth/login']);
    return false;
  }
}