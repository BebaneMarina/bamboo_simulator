// src/app/guards/permission.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.services';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private adminAuth: AdminAuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['requiredPermission'];
    
    if (!requiredPermission) {
      return true; // Pas de permission requise
    }

    const hasPermission = this.adminAuth.hasPermission(
      requiredPermission.entity, 
      requiredPermission.action
    );

    if (!hasPermission) {
      // Rediriger vers le dashboard ou page d'erreur
      this.router.navigate(['/admin/dashboard']);
      return false;
    }

    return true;
  }
}