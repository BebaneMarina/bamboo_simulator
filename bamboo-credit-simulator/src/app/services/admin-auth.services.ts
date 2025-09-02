// src/app/services/admin-auth.service.ts - Version mise à jour
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  permissions: any; // JSONB from database
  is_active: boolean;
  last_login?: string;
}

export interface LoginResponse {
  success: boolean;
  user: AdminUser;
  token: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private baseUrl = 'http://localhost:8000/api'; // Ajustez selon votre API
  private currentUserSubject = new BehaviorSubject<AdminUser | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  constructor(private http: HttpClient) {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    this.checkExistingSession();
  }

  get currentUser(): AdminUser | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && this.tokenSubject.value !== null;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/admin/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.user && response.token) {
            this.currentUserSubject.next(response.user);
            this.tokenSubject.next(response.token);
            localStorage.setItem('admin_user', JSON.stringify(response.user));
            localStorage.setItem('admin_token', response.token);
          }
        }),
        catchError(error => {
          let errorMessage = 'Erreur de connexion';
          
          if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
          } else if (error.status === 403) {
            errorMessage = 'Compte désactivé ou accès refusé';
          } else if (error.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur';
          }
          
          throw new Error(errorMessage);
        })
      );
  }

  logout(): Observable<any> {
    const token = this.token;
    
    // Nettoyer le stockage local immédiatement
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    
    // Notifier le serveur (optionnel)
    if (token) {
      return this.http.post(`${this.baseUrl}/admin/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).pipe(
        catchError(() => {
          // Même si la déconnexion serveur échoue, on considère la déconnexion locale réussie
          return new Observable(observer => {
            observer.next({ success: true });
            observer.complete();
          });
        })
      );
    }
    
    // Retourner un Observable pour la compatibilité
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  hasPermission(entity: string, action: string): boolean {
    const user = this.currentUser;
    if (!user || !user.is_active) return false;

    // Super admin a tous les droits
    if (user.role === 'super_admin') return true;

    // Vérifier les permissions spécifiques
    if (user.permissions && user.permissions[entity]) {
      // Format array (ancien format)
      if (Array.isArray(user.permissions[entity])) {
        return user.permissions[entity].includes(action);
      }
      
      // Format object (nouveau format)
      if (typeof user.permissions[entity] === 'object') {
        return user.permissions[entity][action] === true;
      }
    }

    // Vérifications spécifiques par rôle pour la compatibilité
    if (user.role === 'bank_admin') {
      const bankPermissions = ['banks', 'credit_products', 'savings_products'];
      if (bankPermissions.includes(entity)) {
        return ['read', 'create', 'update'].includes(action);
      }
    }

    if (user.role === 'insurance_admin') {
      const insurancePermissions = ['insurance_products', 'quotes'];
      if (insurancePermissions.includes(entity)) {
        return ['read', 'create', 'update'].includes(action);
      }
    }

    return false;
  }

  getUserDisplayName(): string {
    const user = this.currentUser;
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  }

  getRoleLabel(): string {
    const user = this.currentUser;
    if (!user) return '';

    const roleLabels: { [key: string]: string } = {
      'super_admin': 'Super Administrateur',
      'admin': 'Administrateur',
      'bank_admin': 'Admin Bancaire',
      'insurance_admin': 'Admin Assurance',
      'moderator': 'Modérateur',
      'readonly': 'Lecture seule'
    };

    return roleLabels[user.role] || user.role;
  }

  private checkExistingSession(): void {
    const storedUser = localStorage.getItem('admin_user');
    const storedToken = localStorage.getItem('admin_token');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        // Vérifier que l'utilisateur est toujours actif
        if (user.is_active) {
          this.currentUserSubject.next(user);
          this.tokenSubject.next(storedToken);
        } else {
          this.clearSession();
        }
      } catch (error) {
        this.clearSession();
      }
    }
  }

  private clearSession(): void {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  // Méthode pour rafraîchir les informations utilisateur
  refreshUserInfo(): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/admin/profile`)
      .pipe(
        tap(user => {
          if (user.is_active) {
            this.currentUserSubject.next(user);
            localStorage.setItem('admin_user', JSON.stringify(user));
          } else {
            this.clearSession();
          }
        })
      );
  }

  // Vérifier si le token est encore valide
  validateToken(): Observable<boolean> {
    return this.http.get<{valid: boolean}>(`${this.baseUrl}/admin/validate-token`)
      .pipe(
        tap(response => {
          if (!response.valid) {
            this.clearSession();
          }
        }),
        map(response => response.valid),
        catchError(() => {
          this.clearSession();
          throw new Error('Token invalide');
        })
      );
  }

  // Méthodes utilitaires pour les permissions courantes
  canManageAdmins(): boolean {
    return this.hasPermission('users', 'read') || 
           this.hasPermission('admin_management', 'read') ||
           this.currentUser?.role === 'super_admin';
  }

  canManageBanks(): boolean {
    return this.hasPermission('banks', 'read') ||
           this.currentUser?.role === 'super_admin';
  }

  canManageProducts(): boolean {
    return this.hasPermission('credit_products', 'read') ||
           this.hasPermission('savings_products', 'read') ||
           this.hasPermission('insurance_products', 'read') ||
           this.currentUser?.role === 'super_admin';
  }

  canViewSimulations(): boolean {
    return this.hasPermission('simulations', 'read') ||
           this.currentUser?.role === 'super_admin';
  }

  canViewApplications(): boolean {
    return this.hasPermission('applications', 'read') ||
           this.currentUser?.role === 'super_admin';
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'super_admin';
  }

  isAdmin(): boolean {
    return ['super_admin', 'admin'].includes(this.currentUser?.role || '');
  }
}