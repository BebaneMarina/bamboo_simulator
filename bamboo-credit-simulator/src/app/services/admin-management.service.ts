// admin-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  assigned_bank?: {
    id: string;
    name: string;
    full_name: string;
  };
  assigned_insurance_company?: {
    id: string;
    name: string;
    full_name: string;
  };
  permissions: any;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminCreateRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  assigned_bank_id?: string;
  assigned_insurance_company_id?: string;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  can_view_simulations: boolean;
  can_manage_applications: boolean;
  is_active: boolean;
}

export interface AdminUpdateRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role?: string;
  assigned_bank_id?: string;
  assigned_insurance_company_id?: string;
  can_create_products?: boolean;
  can_edit_products?: boolean;
  can_delete_products?: boolean;
  can_view_simulations?: boolean;
  can_manage_applications?: boolean;
  is_active?: boolean;
}

export interface AdminListResponse {
  admins: AdminUser[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminStats {
  total_admins: number;
  active_admins: number;
  inactive_admins: number;
  by_role: {
    bank_admins: number;
    insurance_admins: number;
    moderators: number;
  };
  recent_admins: number;
}

export interface Institution {
  id: string;
  name: string;
  full_name: string;
  type: 'bank' | 'insurance';
}

export interface InstitutionsResponse {
  banks: Institution[];
  insurance_companies: Institution[];
  total_banks: number;
  total_insurance: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminManagementService {
  private apiUrl = `${environment.apiUrl}/api/admin/management`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer la liste des administrateurs avec filtres
   */
  getAdmins(params: {
    skip?: number;
    limit?: number;
    search?: string;
    role?: string;
    institution_type?: string;
    is_active?: boolean;
  }): Observable<AdminListResponse> {
    let httpParams = new HttpParams();
    
    if (params.skip !== undefined) httpParams = httpParams.set('skip', params.skip.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.institution_type) httpParams = httpParams.set('institution_type', params.institution_type);
    if (params.is_active !== undefined) httpParams = httpParams.set('is_active', params.is_active.toString());

    return this.http.get<AdminListResponse>(`${this.apiUrl}/admins`, { params: httpParams });
  }

  /**
   * Récupérer un administrateur spécifique
   */
  getAdmin(adminId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/admins/${adminId}`);
  }

  /**
   * Créer un nouvel administrateur
   */
  createAdmin(adminData: AdminCreateRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/admins`, adminData);
  }

  /**
   * Mettre à jour un administrateur
   */
  updateAdmin(adminId: string, adminData: AdminUpdateRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/admins/${adminId}`, adminData);
  }

  /**
   * Supprimer un administrateur
   */
  deleteAdmin(adminId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admins/${adminId}`);
  }

  /**
   * Activer/désactiver un administrateur
   */
  toggleAdminStatus(adminId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admins/${adminId}/toggle-status`, {});
  }

  /**
   * Récupérer la liste des institutions (banques et assurances)
   */
  getInstitutions(): Observable<InstitutionsResponse> {
    return this.http.get<InstitutionsResponse>(`${this.apiUrl}/institutions`);
  }

  /**
   * Récupérer les statistiques des administrateurs
   */
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  /**
   * Changer le mot de passe d'un administrateur
   */
  changePassword(adminId: string, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admins/${adminId}/password`, {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  /**
   * Assigner un administrateur à une banque
   */
  assignToBank(adminId: string, bankId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admins/${adminId}/assign-bank`, {
      bank_id: bankId
    });
  }

  /**
   * Assigner un administrateur à une compagnie d'assurance
   */
  assignToInsurance(adminId: string, insuranceId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admins/${adminId}/assign-insurance`, {
      insurance_company_id: insuranceId
    });
  }

  /**
   * Obtenir l'historique des actions d'un administrateur
   */
  getAdminAuditLog(adminId: string, params: {
    skip?: number;
    limit?: number;
    action?: string;
    entity_type?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.skip !== undefined) httpParams = httpParams.set('skip', params.skip.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.entity_type) httpParams = httpParams.set('entity_type', params.entity_type);

    return this.http.get(`${this.apiUrl}/admins/${adminId}/audit-log`, { params: httpParams });
  }

  /**
   * Exporter la liste des administrateurs
   */
  exportAdmins(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admins/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  /**
   * Valider la disponibilité d'un nom d'utilisateur
   */
  validateUsername(username: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.apiUrl}/validate-username`, {
      params: { username }
    });
  }

  /**
   * Valider la disponibilité d'un email
   */
  validateEmail(email: string, excludeAdminId?: string): Observable<{ available: boolean }> {
    let httpParams = new HttpParams().set('email', email);
    if (excludeAdminId) {
      httpParams = httpParams.set('exclude_admin_id', excludeAdminId);
    }

    return this.http.get<{ available: boolean }>(`${this.apiUrl}/validate-email`, {
      params: httpParams
    });
  }

  /**
   * Rechercher des administrateurs
   */
  searchAdmins(query: string, filters?: {
    role?: string;
    institution_type?: string;
    is_active?: boolean;
  }): Observable<AdminUser[]> {
    let httpParams = new HttpParams().set('q', query);
    
    if (filters?.role) httpParams = httpParams.set('role', filters.role);
    if (filters?.institution_type) httpParams = httpParams.set('institution_type', filters.institution_type);
    if (filters?.is_active !== undefined) httpParams = httpParams.set('is_active', filters.is_active.toString());

    return this.http.get<AdminUser[]>(`${this.apiUrl}/search`, { params: httpParams });
  }

  /**
   * Obtenir les permissions par défaut selon le rôle
   */
  getDefaultPermissions(role: string): any {
    const defaultPermissions = {
      'super_admin': {
        banks: ['create', 'read', 'update', 'delete'],
        insurance_companies: ['create', 'read', 'update', 'delete'],
        credit_products: ['create', 'read', 'update', 'delete'],
        savings_products: ['create', 'read', 'update', 'delete'],
        insurance_products: ['create', 'read', 'update', 'delete'],
        simulations: ['read', 'delete'],
        applications: ['read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        audit: ['read']
      },
      'bank_admin': {
        products: { create: true, read: true, update: true, delete: true },
        simulations: { read: true },
        applications: { manage: true },
        bank: { read: true, update: false }
      },
      'insurance_admin': {
        products: { create: true, read: true, update: true, delete: true },
        quotes: { read: true },
        applications: { manage: true },
        insurance_company: { read: true, update: false }
      },
      'moderator': {
        products: { create: false, read: true, update: true, delete: false },
        simulations: { read: true },
        applications: { read: true, update: true }
      }
    };

    return defaultPermissions[role as keyof typeof defaultPermissions] || {};
  }

  /**
   * Vérifier si un utilisateur a une permission spécifique
   */
  hasPermission(permissions: any, resource: string, action: string): boolean {
    if (!permissions) return false;
    
    // Pour les super admins
    if (permissions[resource] && Array.isArray(permissions[resource])) {
      return permissions[resource].includes(action);
    }
    
    // Pour les autres rôles
    if (permissions[resource] && typeof permissions[resource] === 'object') {
      return permissions[resource][action] === true;
    }
    
    return false;
  }

  /**
   * Formater les permissions pour l'affichage
   */
  formatPermissions(permissions: any): string[] {
    if (!permissions) return [];
    
    const formatted: string[] = [];
    
    if (permissions.products) {
      if (permissions.products.create) formatted.push('Créer produits');
      if (permissions.products.update || permissions.products.edit) formatted.push('Modifier produits');
      if (permissions.products.delete) formatted.push('Supprimer produits');
    }
    
    if (permissions.simulations?.read) formatted.push('Voir simulations');
    if (permissions.applications?.manage) formatted.push('Gérer demandes');
    if (permissions.quotes?.read) formatted.push('Voir devis');
    
    return formatted;
  }

  /**
   * Obtenir le libellé d'un rôle
   */
  getRoleLabel(role: string): string {
    const roleLabels = {
      'super_admin': 'Super Administrateur',
      'bank_admin': 'Administrateur Bancaire',
      'insurance_admin': 'Administrateur Assurance',
      'moderator': 'Modérateur',
      'readonly': 'Lecture seule'
    };

    return roleLabels[role as keyof typeof roleLabels] || role;
  }

  /**
   * Obtenir les rôles disponibles pour la création d'admins
   */
  getAvailableRoles(): { value: string; label: string; description: string }[] {
    return [
      {
        value: 'bank_admin',
        label: 'Administrateur Bancaire',
        description: 'Gère les produits d\'une banque spécifique'
      },
      {
        value: 'insurance_admin',
        label: 'Administrateur Assurance',
        description: 'Gère les produits d\'une compagnie d\'assurance spécifique'
      },
      {
        value: 'moderator',
        label: 'Modérateur',
        description: 'Supervise et modère les contenus sans assignation spécifique'
      }
    ];
  }
}