// src/app/user/user-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, User } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="profile-container">
      <div class="container">
        <!-- Header -->
        <div class="profile-header">
          <div class="header-content">
            <div class="user-avatar-large">
              {{ getUserInitials() }}
            </div>
            <div class="user-info">
              <h1>{{ getFullName() }}</h1>
              <p class="user-email">{{ currentUser?.email || currentUser?.phone }}</p>
              <span class="user-badge">{{ getAccountType() }}</span>
            </div>
          </div>
          
          <div class="header-actions">
            <button (click)="toggleEditMode()" class="btn-edit" [class.active]="editMode">
              {{ editMode ? 'Annuler' : 'Modifier le profil' }}
            </button>
          </div>
        </div>

        <!-- Navigation tabs -->
        <div class="profile-tabs">
          <button 
            [class.active]="activeTab === 'personal'"
            (click)="activeTab = 'personal'"
            class="tab-button">
            Informations personnelles
          </button>
          <button 
            [class.active]="activeTab === 'security'"
            (click)="activeTab = 'security'"
            class="tab-button">
            Sécurité
          </button>
          <button 
            [class.active]="activeTab === 'preferences'"
            (click)="activeTab = 'preferences'"
            class="tab-button">
            Préférences
          </button>
        </div>

        <!-- Contenu des tabs -->
        <div class="profile-content">
          
          <!-- Informations personnelles -->
          <div *ngIf="activeTab === 'personal'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <h2>Informations personnelles</h2>
                <p>Gérez vos informations de profil</p>
              </div>
              
              <div class="card-body">
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" *ngIf="editMode">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="firstName">Prénom *</label>
                      <input 
                        type="text" 
                        id="firstName"
                        formControlName="first_name"
                        class="form-input"
                        placeholder="Votre prénom"
                      />
                    </div>

                    <div class="form-group">
                      <label for="lastName">Nom *</label>
                      <input 
                        type="text" 
                        id="lastName"
                        formControlName="last_name"
                        class="form-input"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="email">Email</label>
                      <input 
                        type="email" 
                        id="email"
                        formControlName="email"
                        class="form-input"
                        placeholder="votre@email.com"
                        [readonly]="!canEditEmail"
                      />
                      <small *ngIf="!canEditEmail" class="form-help">
                        Contactez le support pour modifier votre email
                      </small>
                    </div>

                    <div class="form-group">
                      <label for="phone">Téléphone</label>
                      <input 
                        type="tel" 
                        id="phone"
                        formControlName="phone"
                        class="form-input"
                        placeholder="+241 XX XX XX XX"
                        [readonly]="!canEditPhone"
                      />
                      <small *ngIf="!canEditPhone" class="form-help">
                        Contactez le support pour modifier votre téléphone
                      </small>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="dateOfBirth">Date de naissance</label>
                      <input 
                        type="date" 
                        id="dateOfBirth"
                        formControlName="date_of_birth"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label for="gender">Genre</label>
                      <select id="gender" formControlName="gender" class="form-select">
                        <option value="">Sélectionner</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="profession">Profession</label>
                      <input 
                        type="text" 
                        id="profession"
                        formControlName="profession"
                        class="form-input"
                        placeholder="Votre profession"
                      />
                    </div>

                    <div class="form-group">
                      <label for="city">Ville</label>
                      <select id="city" formControlName="city" class="form-select">
                        <option value="">Sélectionner votre ville</option>
                        <option value="libreville">Libreville</option>
                        <option value="port-gentil">Port-Gentil</option>
                        <option value="franceville">Franceville</option>
                        <option value="oyem">Oyem</option>
                        <option value="lambarene">Lambaréné</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="monthlyIncome">Revenus mensuels (FCFA)</label>
                    <input 
                      type="number" 
                      id="monthlyIncome"
                      formControlName="monthly_income"
                      class="form-input"
                      placeholder="Ex: 750 000"
                      min="0"
                    />
                  </div>

                  <div class="form-actions">
                    <button type="submit" [disabled]="profileForm.invalid || isLoading" class="btn-primary">
                      {{ isLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                    </button>
                    <button type="button" (click)="cancelEdit()" class="btn-secondary">
                      Annuler
                    </button>
                  </div>
                </form>

                <!-- Mode lecture -->
                <div *ngIf="!editMode" class="profile-display">
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Prénom</label>
                      <span>{{ currentUser?.first_name || 'Non renseigné' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Nom</label>
                      <span>{{ currentUser?.last_name || 'Non renseigné' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Email</label>
                      <span>{{ currentUser?.email || 'Non renseigné' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Téléphone</label>
                      <span>{{ currentUser?.phone || 'Non renseigné' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Date de naissance</label>
                      <span>{{ formatDate(currentUser?.date_of_birth) || 'Non renseignée' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Genre</label>
                      <span>{{ getGenderLabel(currentUser?.gender) || 'Non renseigné' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Profession</label>
                      <span>{{ currentUser?.profession || 'Non renseignée' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Ville</label>
                      <span>{{ getCityLabel(currentUser?.city) || 'Non renseignée' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Revenus mensuels</label>
                      <span>{{ formatCurrency(currentUser?.monthly_income) || 'Non renseignés' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sécurité -->
          <div *ngIf="activeTab === 'security'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <h2>Sécurité du compte</h2>
                <p>Gérez la sécurité de votre compte</p>
              </div>
              
              <div class="card-body">
                <!-- Changement de mot de passe -->
                <div class="security-section">
                  <h3>Changer le mot de passe</h3>
                  <p>Utilisez un mot de passe fort avec au moins 8 caractères</p>
                  
                  <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                    <div class="form-group">
                      <label for="currentPassword">Mot de passe actuel</label>
                      <input 
                        type="password" 
                        id="currentPassword"
                        formControlName="current_password"
                        class="form-input"
                        placeholder="Votre mot de passe actuel"
                      />
                    </div>

                    <div class="form-group">
                      <label for="newPassword">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        id="newPassword"
                        formControlName="new_password"
                        class="form-input"
                        placeholder="Nouveau mot de passe"
                      />
                    </div>

                    <div class="form-group">
                      <label for="confirmPassword">Confirmer le mot de passe</label>
                      <input 
                        type="password" 
                        id="confirmPassword"
                        formControlName="confirm_password"
                        class="form-input"
                        placeholder="Confirmez le nouveau mot de passe"
                      />
                    </div>

                    <button type="submit" [disabled]="passwordForm.invalid || isChangingPassword" class="btn-primary">
                      {{ isChangingPassword ? 'Modification...' : 'Changer le mot de passe' }}
                    </button>
                  </form>
                </div>

                <!-- Sessions actives -->
                <div class="security-section">
                  <h3>Sessions actives</h3>
                  <p>Gérez les appareils connectés à votre compte</p>
                  
                  <div class="sessions-list">
                    <div class="session-item current">
                      <div class="session-info">
                        <div class="session-device">🖥️ Session actuelle</div>
                        <div class="session-details">
                          <span>{{ getCurrentDeviceInfo() }}</span>
                          <span class="session-time">Maintenant</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button (click)="logoutAllDevices()" class="btn-danger">
                    Se déconnecter de tous les appareils
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Préférences -->
          <div *ngIf="activeTab === 'preferences'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <h2>Préférences</h2>
                <p>Personnalisez votre expérience</p>
              </div>
              
              <div class="card-body">
                <form [formGroup]="preferencesForm" (ngSubmit)="updatePreferences()">
                  
                  <!-- Notifications -->
                  <div class="preferences-section">
                    <h3>Notifications</h3>
                    <div class="preference-item">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="email_notifications">
                        <span class="checkmark"></span>
                        Recevoir les notifications par email
                      </label>
                    </div>
                    <div class="preference-item">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="sms_notifications">
                        <span class="checkmark"></span>
                        Recevoir les notifications par SMS
                      </label>
                    </div>
                    <div class="preference-item">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="marketing_emails">
                        <span class="checkmark"></span>
                        Recevoir les offres promotionnelles
                      </label>
                    </div>
                  </div>

                  <!-- Langue et région -->
                  <div class="preferences-section">
                    <h3>Langue et région</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="language">Langue</label>
                        <select id="language" formControlName="language" class="form-select">
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="timezone">Fuseau horaire</label>
                        <select id="timezone" formControlName="timezone" class="form-select">
                          <option value="Africa/Libreville">Libreville (WAT)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="submit" [disabled]="preferencesForm.invalid || isUpdatingPreferences" class="btn-primary">
                      {{ isUpdatingPreferences ? 'Enregistrement...' : 'Enregistrer les préférences' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  //styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  preferencesForm!: FormGroup;
  
  activeTab: 'personal' | 'security' | 'preferences' = 'personal';
  editMode = false;
  isLoading = false;
  isChangingPassword = false;
  isUpdatingPreferences = false;
  
  canEditEmail = false;
  canEditPhone = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]],
      date_of_birth: [''],
      gender: [''],
      profession: [''],
      city: [''],
      monthly_income: ['', [Validators.min(0)]]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', [Validators.required]]
    });

    this.preferencesForm = this.fb.group({
      email_notifications: [true],
      sms_notifications: [false],
      marketing_emails: [true],
      language: ['fr'],
      timezone: ['Africa/Libreville']
    });
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user: User | null) => {
        this.currentUser = user;
        if (user) {
          this.populateForms();
          this.determineEditPermissions();
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.notificationService.showError('Erreur lors du chargement du profil');
      }
    });
  }

  private populateForms(): void {
    if (this.currentUser) {
      this.profileForm.patchValue(this.currentUser);
      
      // Charger les préférences si disponibles
      if (this.currentUser.preferences) {
        this.preferencesForm.patchValue(this.currentUser.preferences);
      }
    }
  }

  private determineEditPermissions(): void {
    // Logique pour déterminer si l'utilisateur peut modifier son email/téléphone
    // Par exemple, s'il s'est inscrit avec email, il ne peut pas modifier le téléphone principal
    this.canEditEmail = !this.currentUser?.phone || !!this.currentUser?.email;
    this.canEditPhone = !this.currentUser?.email || !!this.currentUser?.phone;
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.populateForms(); // Reset form
    }
  }

  cancelEdit(): void {
    this.editMode = false;
    this.populateForms();
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isLoading = true;
    
    this.authService.updateProfile(this.profileForm.value).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.currentUser = updatedUser;
        this.editMode = false;
        this.notificationService.showSuccess('Profil mis à jour avec succès');
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showError(error.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const formValues = this.passwordForm.value;
    if (formValues.new_password !== formValues.confirm_password) {
      this.notificationService.showError('Les mots de passe ne correspondent pas');
      return;
    }

    this.isChangingPassword = true;

    this.authService.changePassword({
      current_password: formValues.current_password,
      new_password: formValues.new_password
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.notificationService.showSuccess('Mot de passe modifié avec succès');
      },
      error: (error) => {
        this.isChangingPassword = false;
        this.notificationService.showError(error.message || 'Erreur lors du changement de mot de passe');
      }
    });
  }

  updatePreferences(): void {
    if (this.preferencesForm.invalid) return;

    this.isUpdatingPreferences = true;

    this.authService.updatePreferences(this.preferencesForm.value).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isUpdatingPreferences = false;
        this.notificationService.showSuccess('Préférences mises à jour');
      },
      error: (error: { message: any; }) => {
        this.isUpdatingPreferences = false;
        this.notificationService.showError(error.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  logoutAllDevices(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter de tous les appareils ?')) {
      this.authService.logoutAllDevices().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.notificationService.showSuccess('Déconnexion de tous les appareils réussie');
          this.router.navigate(['/auth/login']);
        },
        error: (error: any) => {
          this.notificationService.showError('Erreur lors de la déconnexion');
        }
      });
    }
  }

  // MÉTHODES UTILITAIRES
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstInitial = this.currentUser.first_name?.charAt(0).toUpperCase() || '';
    const lastInitial = this.currentUser.last_name?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U';
  }

  getFullName(): string {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
  }

  getAccountType(): string {
    return 'Compte Personnel';
  }

  getCurrentDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome sur ' + this.getOS();
    if (userAgent.includes('Firefox')) return 'Firefox sur ' + this.getOS();
    if (userAgent.includes('Safari')) return 'Safari sur ' + this.getOS();
    return 'Navigateur inconnu';
  }

  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'OS inconnu';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  getGenderLabel(gender: string | undefined): string {
    const labels: { [key: string]: string } = {
      'male': 'Homme',
      'female': 'Femme',
      'other': 'Autre'
    };
    return gender ? labels[gender] : '';
  }

  getCityLabel(city: string | undefined): string {
    const labels: { [key: string]: string } = {
      'libreville': 'Libreville',
      'port-gentil': 'Port-Gentil',
      'franceville': 'Franceville',
      'oyem': 'Oyem',
      'lambarene': 'Lambaréné',
      'other': 'Autre'
    };
    return city ? labels[city] : '';
  }
}