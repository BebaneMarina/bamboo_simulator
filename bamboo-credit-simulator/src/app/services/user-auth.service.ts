// auth.service.ts - Service Angular pour l'authentification utilisateur

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Params, Router } from '@angular/router';

// ==================== INTERFACES ====================

export interface User {
  settings: User | null;
  id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  profession?: string;
  monthly_income?: number;
  city?: string;
  address?: string;
  registration_method: 'email' | 'phone';
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  preferences: any;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  remember_me?: boolean;
  device_info?: any;
}

export interface RegisterRequest {
  registration_method: 'email' | 'phone';
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  profession?: string;
  monthly_income?: number;
  city?: string;
  address?: string;
  password?: string;
  preferences?: any;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  refresh_token?: string;
  expires_in: number;
  message?: string;
}

export interface RegistrationResponse {
  success: boolean;
  user: User;
  verification_required: boolean;
  verification_method?: string;
  message: string;
}

export interface VerificationRequest {
  email?: string;
  phone?: string;
  code: string;
}

export interface UserApplication {
  id: string;
  type: 'credit' | 'savings' | 'insurance';
  status: string;
  product_name: string;
  bank_or_company_name: string;
  amount?: number;
  submitted_at: string;
  updated_at: string;
  
  // Propriétés communes optionnelles
  duration?: number;
  reference_number?: string;
  
  // Propriétés spécifiques au crédit
  monthly_payment?: number;
  
  // Propriétés spécifiques à l'épargne
  monthly_amount?: number;
  
  // Propriétés spécifiques à l'assurance
  coverage_type?: string;
  monthly_premium?: number;
    coverage_amount?: number;
    [key: string]: any;
}

export interface UserSimulation {
  id: string;
  type: 'credit' | 'savings' | 'insurance';
  status: string;
  name?: string;
  product_name: string;
  bank_or_company_name: string;
  created_at: string;
  updated_at?: string;
  
  parameters: {
    amount?: number;
    duration?: number;
    monthly_income?: number;
    down_payment?: number;
    current_debts?: number;
    monthly_amount?: number;
    initial_amount?: number;
    goal?: string;
    coverage_type?: string;
    coverage_amount?: number;
    deductible?: number;
    age?: number;
  };
  
  result_summary?: {
    // Résultats crédit
    monthly_payment?: number;
    interest_rate?: number;
    total_cost?: number;
    debt_ratio?: number;
    remaining_income?: number;
    
    // Résultats épargne
    final_amount?: number;
    annual_return?: number;
    capital_gain?: number;
    
    // Résultats assurance
    monthly_premium?: number;
    annual_premium?: number;
    coverage_amount?: number; // AJOUTEZ CETTE LIGNE
  };
  
  chart_data?: any;
  recommendations?: string[];
  alternative_offers?: Array<{
    bank_name: string;
    rate: number;
    description: string;
  }>;
}

export interface UserApplication {
  documents?: any;
  id: string;
  type: 'credit' | 'savings' | 'insurance';
  product_name: string;
  bank_or_company_name: string;
  amount?: number;
  status: string;
  submitted_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  priority: string;
  created_at: string;
}

export interface UserDashboard {
  user: User;
  stats: {
    total_credit_simulations: number;
    total_savings_simulations: number;
    total_insurance_quotes: number;
    total_credit_applications: number;
    total_savings_applications: number;
    total_insurance_applications: number;
    unread_notifications: number;
  };
  recent_simulations: UserSimulation[];
  recent_applications: UserApplication[];
  notifications: UserNotification[];
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
  
  // Subjects pour l'état de l'authentification
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  // Observables publics
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  getCurrentUser: any;
    updatePreferences: any;
    logoutAllDevices: any;
    updateSettings: any;
    requestDataDownload: any;
    deleteAccount: any;
    downloadSimulation: any;
    deleteSimulation: any;
    getSimulation: any;
    cancelApplication: any;
    getApplication: any;
    downloadDocument: any;
    submitCreditApplication: any;
  getUserStats: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  // ==================== INITIALISATION ====================

  private initializeAuth(): void {
    const token = localStorage.getItem('bamboo_user_token');
    const user = localStorage.getItem('bamboo_user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.setAuthData(parsedUser, token);
        
        // Vérifier la validité du token
        this.verifyToken().subscribe({
          next: (valid) => {
            if (!valid) {
              this.logout();
            }
          },
          error: () => this.logout()
        });
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
        this.logout();
      }
    }
  }

  private setAuthData(user: User, token: string): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.tokenSubject.next(token);
    
    localStorage.setItem('bamboo_user_token', token);
    localStorage.setItem('bamboo_user', JSON.stringify(user));
  }

  private clearAuthData(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.tokenSubject.next(null);
    
    localStorage.removeItem('bamboo_user_token');
    localStorage.removeItem('bamboo_user');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // ==================== MÉTHODES D'AUTHENTIFICATION ====================

  register(registerData: RegisterRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap(response => {
          if (response.success && !response.verification_required) {
            // Si pas de vérification requise, connecter directement
            this.setAuthData(response.user, ''); // Token sera fourni après vérification
          }
        }),
        catchError(this.handleError)
      );
  }

  login(loginData: LoginRequest): Observable<LoginResponse> {
    // Ajouter info sur l'appareil
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
    
    const requestData = { ...loginData, device_info: deviceInfo };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, requestData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.user, response.token);
          }
        }),
        catchError(this.handleError)
      );
  }

  verify(verificationData: VerificationRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/verify`, verificationData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.user, response.token);
          }
        }),
        catchError(this.handleError)
      );
  }

  resendVerification(data: { email?: string; phone?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, data)
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.clearAuthData();
          this.router.navigate(['/']);
        }),
        catchError((error) => {
          // Même en cas d'erreur, on déconnecte localement
          this.clearAuthData();
          this.router.navigate(['/']);
          return throwError(error);
        })
      );
  }

  verifyToken(): Observable<boolean> {
    const token = this.tokenSubject.value;
    if (!token) return new BehaviorSubject(false).asObservable();
    
    const headers = this.getAuthHeaders();
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/validate-token`, { headers })
      .pipe(
        map(response => response.valid),
        catchError(() => new BehaviorSubject(false).asObservable())
      );
  }

  // ==================== GESTION DU PROFIL ====================

  getProfile(): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/profile`, { headers })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('bamboo_user', JSON.stringify(user));
        }),
        catchError(this.handleError)
      );
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.put<User>(`${this.apiUrl}/profile`, profileData, { headers })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('bamboo_user', JSON.stringify(user));
        }),
        catchError(this.handleError)
      );
  }

  changePassword(data: { current_password: string; new_password: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/change-password`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  // ==================== GESTION DES SIMULATIONS ====================

  saveSimulation(data: { simulation_id: string; simulation_type: string; name: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/simulations/save`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  getUserSimulations(): Observable<UserSimulation[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserSimulation[]>(`${this.apiUrl}/simulations`, { headers })
      .pipe(catchError(this.handleError));
  }

  // ==================== GESTION DES DEMANDES ====================

  createCreditApplication(applicationData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/applications/credit`, applicationData, { headers })
      .pipe(catchError(this.handleError));
  }

  createSavingsApplication(applicationData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/applications/savings`, applicationData, { headers })
      .pipe(catchError(this.handleError));
  }

  createInsuranceApplication(applicationData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/applications/insurance`, applicationData, { headers })
      .pipe(catchError(this.handleError));
  }

  getUserApplications(): Observable<UserApplication[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserApplication[]>(`${this.apiUrl}/applications`, { headers })
      .pipe(catchError(this.handleError));
  }

  // ==================== GESTION DES NOTIFICATIONS ====================

  getNotifications(unreadOnly: boolean = false, limit: number = 50): Observable<UserNotification[]> {
    const headers = this.getAuthHeaders();
    const params = { unread_only: unreadOnly.toString(), limit: limit.toString() };
    
    return this.http.get<UserNotification[]>(`${this.apiUrl}/notifications`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  markNotificationsRead(notificationIds: string[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/notifications/mark-read`, 
      { notification_ids: notificationIds }, 
      { headers }
    ).pipe(catchError(this.handleError));
  }

  // ==================== DASHBOARD ====================

  getDashboard(): Observable<UserDashboard> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserDashboard>(`${this.apiUrl}/dashboard`, { headers })
      .pipe(catchError(this.handleError));
  }

  // ==================== RESET PASSWORD ====================

  requestPasswordReset(data: { email?: string; phone?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data)
      .pipe(catchError(this.handleError));
  }

  confirmPasswordReset(data: { email?: string; phone?: string; code: string; new_password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/confirm`, data)
      .pipe(catchError(this.handleError));
  }

  // ==================== UPLOAD DOCUMENTS ====================

  uploadDocument(file: File): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.tokenSubject.value}`
    });

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/documents/upload`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // ==================== GETTERS ====================

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  // ==================== UTILITY METHODS ====================

  isEmailVerified(): boolean {
    return this.currentUser?.email_verified ?? false;
  }

  isPhoneVerified(): boolean {
    return this.currentUser?.phone_verified ?? false;
  }

  getFullName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
  }

  getContactMethod(): string {
    if (!this.currentUser) return '';
    return this.currentUser.registration_method === 'email' 
      ? (this.currentUser.email || '') 
      : (this.currentUser.phone || '');
  }

  needsVerification(): boolean {
    if (!this.currentUser) return false;
    
    if (this.currentUser.registration_method === 'email') {
      return !this.currentUser.email_verified;
    } else {
      return !this.currentUser.phone_verified;
    }
  }

  // ==================== GESTION D'ERREURS ====================

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      if (error.status === 401) {
        this.logout().subscribe();
        errorMessage = 'Session expirée, veuillez vous reconnecter';
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Données invalides';
            break;
          case 403:
            errorMessage = 'Accès non autorisé';
            break;
          case 404:
            errorMessage = 'Ressource introuvable';
            break;
          case 500:
            errorMessage = 'Erreur serveur';
            break;
        }
      }
    }

    console.error('Erreur AuthService:', error);
    return throwError(() => new Error(errorMessage));
  };

  // ==================== AUTO-REFRESH TOKEN (optionnel) ====================

  startTokenRefresh(): void {
    // Rafraîchir le token toutes les 23h (si token expire dans 24h)
    timer(0, 23 * 60 * 60 * 1000).pipe(
      switchMap(() => this.verifyToken()),
      catchError(() => {
        this.logout();
        return throwError('Token invalide');
      })
    ).subscribe();
  }
}