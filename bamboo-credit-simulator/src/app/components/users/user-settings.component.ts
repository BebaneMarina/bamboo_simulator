// src/app/user/user-settings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, User } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="settings-container">
      <div class="container">
        <div class="settings-header">
          <h1>Paramètres du compte</h1>
          <p>Gérez vos préférences et paramètres de compte</p>
        </div>

        <div class="settings-content">
          <div class="settings-nav">
            <button 
              *ngFor="let section of settingSections"
              [class.active]="activeSection === section.id"
              (click)="activeSection = section.id"
              class="nav-item">
              <div class="nav-icon">{{ section.icon }}</div>
              <span>{{ section.name }}</span>
            </button>
          </div>

          <div class="settings-main">
            <!-- Notifications -->
            <div *ngIf="activeSection === 'notifications'" class="settings-section">
              <h2>Notifications</h2>
              <p>Gérez comment et quand vous recevez des notifications</p>
              
              <form [formGroup]="notificationForm" (ngSubmit)="saveNotificationSettings()">
                <div class="setting-group">
                  <h3>Notifications par email</h3>
                  <div class="setting-item">
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="email_simulations">
                      <span class="toggle-slider"></span>
                      <div class="setting-content">
                        <strong>Notifications urgentes</strong>
                        <p>Recevoir des SMS pour les notifications importantes</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button type="submit" [disabled]="isLoading" class="btn-primary">
                  {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </form>
            </div>

            <!-- Sécurité -->
            <div *ngIf="activeSection === 'security'" class="settings-section">
              <h2>Sécurité</h2>
              <p>Protégez votre compte avec des paramètres de sécurité avancés</p>

              <div class="security-items">
                <div class="security-item">
                  <div class="security-content">
                    <h3>Authentification à deux facteurs</h3>
                    <p>Ajoutez une couche de sécurité supplémentaire à votre compte</p>
                  </div>
                  <button class="btn-secondary" [disabled]="true">
                    Bientôt disponible
                  </button>
                </div>

                <div class="security-item">
                  <div class="security-content">
                    <h3>Sessions actives</h3>
                    <p>Gérez les appareils connectés à votre compte</p>
                  </div>
                  <button (click)="viewSessions()" class="btn-secondary">
                    Voir les sessions
                  </button>
                </div>

                <div class="security-item">
                  <div class="security-content">
                    <h3>Historique de connexion</h3>
                    <p>Consultez l'historique de vos connexions récentes</p>
                  </div>
                  <button (click)="viewLoginHistory()" class="btn-secondary">
                    Voir l'historique
                  </button>
                </div>
              </div>
            </div>

            <!-- Données et confidentialité -->
            <div *ngIf="activeSection === 'privacy'" class="settings-section">
              <h2>Données et confidentialité</h2>
              <p>Contrôlez vos données personnelles et votre confidentialité</p>

              <form [formGroup]="privacyForm" (ngSubmit)="savePrivacySettings()">
                <div class="setting-group">
                  <h3>Collecte de données</h3>
                  
                  <div class="setting-item">
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="analytics_tracking">
                      <span class="toggle-slider"></span>
                      <div class="setting-content">
                        <strong>Données d'utilisation</strong>
                        <p>Autoriser la collecte de données anonymes pour améliorer nos services</p>
                      </div>
                    </label>
                  </div>

                  <div class="setting-item">
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="personalized_offers">
                      <span class="toggle-slider"></span>
                      <div class="setting-content">
                        <strong>Offres personnalisées</strong>
                        <p>Recevoir des offres basées sur votre profil et vos simulations</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="setting-group">
                  <h3>Partage de données</h3>
                  
                  <div class="setting-item">
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="share_with_partners">
                      <span class="toggle-slider"></span>
                      <div class="setting-content">
                        <strong>Partenaires bancaires</strong>
                        <p>Partager vos données avec nos partenaires pour des offres personnalisées</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button type="submit" [disabled]="isLoading" class="btn-primary">
                  {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </form>

              <div class="data-actions">
                <h3>Actions sur les données</h3>
                <div class="action-buttons">
                  <button (click)="downloadData()" class="btn-outline">
                    Télécharger mes données
                  </button>
                  <button (click)="deleteAccount()" class="btn-danger">
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>

            <!-- Interface -->
            <div *ngIf="activeSection === 'interface'" class="settings-section">
              <h2>Interface</h2>
              <p>Personnalisez l'apparence de votre interface</p>

              <form [formGroup]="interfaceForm" (ngSubmit)="saveInterfaceSettings()">
                <div class="setting-group">
                  <h3>Apparence</h3>
                  
                  <div class="setting-item">
                    <label>Thème</label>
                    <select formControlName="theme" class="form-select">
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="auto">Automatique</option>
                    </select>
                  </div>

                  <div class="setting-item">
                    <label>Langue</label>
                    <select formControlName="language" class="form-select">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div class="setting-item">
                    <label>Devise par défaut</label>
                    <select formControlName="currency" class="form-select">
                      <option value="XAF">FCFA</option>
                      <option value="EUR">Euro</option>
                      <option value="USD">Dollar US</option>
                    </select>
                  </div>
                </div>

                <div class="setting-group">
                  <h3>Fonctionnalités</h3>
                  
                  <div class="setting-item">
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="auto_save">
                      <span class="toggle-slider"></span>
                      <div class="setting-content">
                        <strong>Sauvegarde automatique</strong>
                        <p>Sauvegarder automatiquement vos simulations</p>
                      </div>
                    </label>
                  </div>

                  <div class="setting-item">
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="show_tips">
                      <span class="toggle-slider"></span>
                      <div class="setting-content">
                        <strong>Conseils et astuces</strong>
                        <p>Afficher des conseils pour optimiser vos simulations</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button type="submit" [disabled]="isLoading" class="btn-primary">
                  {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  //styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activeSection = 'notifications';
  isLoading = false;

  notificationForm!: FormGroup;
  privacyForm!: FormGroup;
  interfaceForm!: FormGroup;

  settingSections = [
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Sécurité', icon: '🔒' },
    { id: 'privacy', name: 'Confidentialité', icon: '🛡️' },
    { id: 'interface', name: 'Interface', icon: '🎨' }
  ];

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
    this.notificationForm = this.fb.group({
      email_simulations: [true],
      email_applications: [true],
      email_marketing: [false],
      sms_urgent: [false]
    });

    this.privacyForm = this.fb.group({
      analytics_tracking: [true],
      personalized_offers: [true],
      share_with_partners: [false]
    });

    this.interfaceForm = this.fb.group({
      theme: ['light'],
      language: ['fr'],
      currency: ['XAF'],
      auto_save: [true],
      show_tips: [true]
    });
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user: User | null) => {
        this.currentUser = user;
        if (user && user.settings) {
          this.populateFormsFromSettings(user.settings);
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    });
  }

  private populateFormsFromSettings(settings: any): void {
    if (settings.notifications) {
      this.notificationForm.patchValue(settings.notifications);
    }
    if (settings.privacy) {
      this.privacyForm.patchValue(settings.privacy);
    }
    if (settings.interface) {
      this.interfaceForm.patchValue(settings.interface);
    }
  }

  saveNotificationSettings(): void {
    this.isLoading = true;
    
    this.authService.updateSettings({
      notifications: this.notificationForm.value
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess('Paramètres de notification mis à jour');
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notificationService.showError('Erreur lors de la sauvegarde');
      }
    });
  }

  savePrivacySettings(): void {
    this.isLoading = true;
    
    this.authService.updateSettings({
      privacy: this.privacyForm.value
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess('Paramètres de confidentialité mis à jour');
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notificationService.showError('Erreur lors de la sauvegarde');
      }
    });
  }

  saveInterfaceSettings(): void {
    this.isLoading = true;
    
    this.authService.updateSettings({
      interface: this.interfaceForm.value
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.showSuccess('Paramètres d\'interface mis à jour');
        // Appliquer le thème si changé
        this.applyTheme(this.interfaceForm.get('theme')?.value);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notificationService.showError('Erreur lors de la sauvegarde');
      }
    });
  }

  private applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  viewSessions(): void {
    this.router.navigate(['/profile'], { fragment: 'security' });
  }

  viewLoginHistory(): void {
    this.notificationService.showInfo('Fonctionnalité bientôt disponible');
  }

  downloadData(): void {
    if (confirm('Voulez-vous télécharger toutes vos données personnelles ?')) {
      this.authService.requestDataDownload().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.notificationService.showSuccess('Demande de téléchargement envoyée. Vous recevrez un email avec le lien de téléchargement.');
        },
        error: (error: any) => {
          this.notificationService.showError('Erreur lors de la demande de téléchargement');
        }
      });
    }
  }

  deleteAccount(): void {
    const confirmation = prompt('Pour supprimer votre compte, tapez "SUPPRIMER" en majuscules:');
    
    if (confirmation === 'SUPPRIMER') {
      this.authService.deleteAccount().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.notificationService.showSuccess('Votre compte a été supprimé');
          this.router.navigate(['/']);
        },
        error: (error: any) => {
          this.notificationService.showError('Erreur lors de la suppression du compte');
        }
      });
    } else if (confirmation !== null) {
      this.notificationService.showError('Confirmation incorrecte. Suppression annulée.');
    }
  }
}