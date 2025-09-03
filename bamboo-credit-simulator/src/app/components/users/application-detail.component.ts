// src/app/components/users/application-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, UserApplication } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

// Interface étendue pour gérer toutes les propriétés optionnelles
export interface ExtendedUserApplication extends UserApplication {
  // Propriétés pour les crédits
  duration?: number;
  monthly_payment?: number;
  interest_rate?: number;
  
  // Propriétés pour l'épargne
  monthly_amount?: number;
  expected_return?: number;
  
  // Propriétés pour l'assurance
  coverage_type?: string;
  monthly_premium?: number;
  deductible?: number;
  
  // Propriétés pour les documents et communication
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
  
  messages?: Array<{
    id: string;
    sender_name: string;
    content: string;
    sent_at: string;
    sender_type: 'user' | 'advisor' | 'system';
  }>;
  
  // Propriétés pour le contact
  assigned_advisor?: string;
  advisor_phone?: string;
  advisor_email?: string;
  
  // Propriétés supplémentaires
  reference_number?: string;
}

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="application-detail-container">
      <div class="container">
        
        <!-- Loading state -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Chargement de la demande...</p>
        </div>

        <!-- Error state -->
        <div *ngIf="error && !isLoading" class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Erreur</h2>
          <p>{{ error }}</p>
          <button routerLink="/applications" class="btn-primary">
            Retour aux demandes
          </button>
        </div>

        <!-- Application details -->
        <div *ngIf="application && !isLoading" class="application-content">
          
          <!-- Header -->
          <div class="detail-header">
            <div class="header-info">
              <div class="breadcrumb">
                <a routerLink="/applications">Mes demandes</a>
                <span class="separator">›</span>
                <span>{{ getTypeName(application.type) }}</span>
              </div>
              
              <div class="application-title">
                <div class="title-icon" [class]="application.type">
                  <span *ngIf="application.type === 'credit'">💳</span>
                  <span *ngIf="application.type === 'savings'">💰</span>
                  <span *ngIf="application.type === 'insurance'">🛡️</span>
                </div>
                <div class="title-content">
                  <h1>{{ application.product_name }}</h1>
                  <p class="application-subtitle">
                    {{ application.bank_or_company_name }} • 
                    Réf: {{ applicationReferenceNumber }}
                  </p>
                </div>
              </div>
            </div>

            <div class="header-actions">
              <button 
                *ngIf="canModifyApplication()"
                (click)="editApplication()" 
                class="btn-outline">
                ✏️ Modifier
              </button>
              <button 
                *ngIf="canCancelApplication()"
                (click)="cancelApplication()" 
                class="btn-danger">
                ❌ Annuler
              </button>
            </div>
          </div>

          <!-- Status and progress -->
          <div class="status-section">
            <div class="status-card">
              <div class="status-header">
                <span class="status-badge" [class]="application.status">
                  {{ getStatusLabel(application.status) }}
                </span>
                <span class="status-date">
                  Mise à jour le {{ formatDate(application.updated_at) }}
                </span>
              </div>
              
              <div class="progress-timeline">
                <div class="timeline-step" [class.completed]="isStepCompleted('submitted')">
                  <div class="step-icon">📝</div>
                  <div class="step-content">
                    <strong>Demande soumise</strong>
                    <p>{{ formatDate(application.submitted_at) }}</p>
                  </div>
                </div>
                
                <div class="timeline-step" [class.completed]="isStepCompleted('under_review')">
                  <div class="step-icon">🔍</div>
                  <div class="step-content">
                    <strong>En cours d'étude</strong>
                    <p *ngIf="application.status === 'under_review'">En cours...</p>
                  </div>
                </div>
                
                <div class="timeline-step" [class.completed]="isStepCompleted('decision')">
                  <div class="step-icon">
                    <span *ngIf="application.status === 'approved'">✅</span>
                    <span *ngIf="application.status === 'rejected'">❌</span>
                    <span *ngIf="!['approved', 'rejected'].includes(application.status)">⏳</span>
                  </div>
                  <div class="step-content">
                    <strong>Décision</strong>
                    <p *ngIf="['approved', 'rejected'].includes(application.status)">
                      {{ formatDate(application.updated_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main content -->
          <div class="detail-grid">
            
            <!-- Left column -->
            <div class="main-column">
              
              <!-- Application details -->
              <div class="detail-card">
                <div class="card-header">
                  <h2>Détails de la demande</h2>
                </div>
                <div class="card-body">
                  
                  <!-- Credit details -->
                  <div *ngIf="application.type === 'credit'" class="details-grid">
                    <div class="detail-item">
                      <label>Montant demandé</label>
                      <span class="value">{{ formatCurrency(application.amount) }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Durée de remboursement</label>
                      <span class="value">{{ applicationDuration }} mois</span>
                    </div>
                    <div class="detail-item" *ngIf="applicationMonthlyPayment > 0">
                      <label>Mensualité estimée</label>
                      <span class="value">{{ formatCurrency(applicationMonthlyPayment) }}</span>
                    </div>
                    <div class="detail-item" *ngIf="applicationInterestRate > 0">
                      <label>Taux d'intérêt</label>
                      <span class="value">{{ formatPercent(applicationInterestRate) }}</span>
                    </div>
                  </div>

                  <!-- Savings details -->
                  <div *ngIf="application.type === 'savings'" class="details-grid">
                    <div class="detail-item">
                      <label>Montant initial</label>
                      <span class="value">{{ formatCurrency(application.amount) }}</span>
                    </div>
                    <div class="detail-item" *ngIf="applicationMonthlyAmount > 0">
                      <label>Épargne mensuelle</label>
                      <span class="value">{{ formatCurrency(applicationMonthlyAmount) }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Durée d'épargne</label>
                      <span class="value">{{ applicationDuration }} mois</span>
                    </div>
                    <div class="detail-item" *ngIf="applicationExpectedReturn > 0">
                      <label>Rendement attendu</label>
                      <span class="value">{{ formatPercent(applicationExpectedReturn) }}</span>
                    </div>
                  </div>

                  <!-- Insurance details -->
                  <div *ngIf="application.type === 'insurance'" class="details-grid">
                    <div class="detail-item">
                      <label>Type de couverture</label>
                      <span class="value">{{ applicationCoverageType }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Montant assuré</label>
                      <span class="value">{{ formatCurrency(application.amount) }}</span>
                    </div>
                    <div class="detail-item" *ngIf="applicationMonthlyPremium > 0">
                      <label>Prime mensuelle</label>
                      <span class="value">{{ formatCurrency(applicationMonthlyPremium) }}</span>
                    </div>
                    <div class="detail-item" *ngIf="applicationDeductible > 0">
                      <label>Franchise</label>
                      <span class="value">{{ formatCurrency(applicationDeductible) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Documents -->
              <div *ngIf="hasDocuments()" class="detail-card">
                <div class="card-header">
                  <h2>Documents fournis</h2>
                </div>
                <div class="card-body">
                  <div class="documents-list">
                    <div *ngFor="let document of application.documents" class="document-item">
                      <div class="document-info">
                        <div class="document-icon">📄</div>
                        <div class="document-details">
                          <strong>{{ document.name }}</strong>
                          <p>{{ document.type }} • {{ formatFileSize(document.size) }}</p>
                        </div>
                      </div>
                      <button (click)="downloadDocument(document)" class="btn-sm btn-outline">
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Communication history -->
              <div *ngIf="hasMessages()" class="detail-card">
                <div class="card-header">
                  <h2>Historique des communications</h2>
                </div>
                <div class="card-body">
                  <div class="messages-list">
                    <div *ngFor="let message of application.messages" class="message-item">
                      <div class="message-header">
                        <strong>{{ message.sender_name }}</strong>
                        <span class="message-date">{{ formatDate(message.sent_at) }}</span>
                      </div>
                      <div class="message-content">
                        {{ message.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right column -->
            <div class="sidebar-column">
              
              <!-- Contact information -->
              <div class="detail-card">
                <div class="card-header">
                  <h3>Contact</h3>
                </div>
                <div class="card-body">
                  <div class="contact-info">
                    <div class="contact-item">
                      <label>Conseiller assigné</label>
                      <span class="value">{{ applicationAssignedAdvisor }}</span>
                    </div>
                    <div class="contact-item" *ngIf="applicationAdvisorPhone">
                      <label>Téléphone</label>
                      <span class="value">{{ applicationAdvisorPhone }}</span>
                    </div>
                    <div class="contact-item" *ngIf="applicationAdvisorEmail">
                      <label>Email</label>
                      <span class="value">{{ applicationAdvisorEmail }}</span>
                    </div>
                  </div>
                  
                  <button class="btn-primary contact-btn" *ngIf="hasContactInfo()">
                    Contacter le conseiller
                  </button>
                </div>
              </div>

              <!-- Next steps -->
              <div *ngIf="getNextSteps().length" class="detail-card">
                <div class="card-header">
                  <h3>Prochaines étapes</h3>
                </div>
                <div class="card-body">
                  <div class="steps-list">
                    <div *ngFor="let step of getNextSteps()" class="step-item">
                      <div class="step-icon">{{ step.icon }}</div>
                      <div class="step-content">
                        <strong>{{ step.title }}</strong>
                        <p>{{ step.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Application metadata -->
              <div class="detail-card">
                <div class="card-header">
                  <h3>Informations</h3>
                </div>
                <div class="card-body">
                  <div class="metadata-list">
                    <div class="meta-item">
                      <label>Numéro de référence</label>
                      <span class="value">{{ applicationReferenceNumber }}</span>
                    </div>
                    <div class="meta-item">
                      <label>Date de soumission</label>
                      <span class="value">{{ formatFullDate(application.submitted_at) }}</span>
                    </div>
                    <div class="meta-item">
                      <label>Dernière mise à jour</label>
                      <span class="value">{{ formatFullDate(application.updated_at) }}</span>
                    </div>
                    <div class="meta-item">
                      <label>Statut</label>
                      <span class="value">{{ getStatusLabel(application.status) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./application-detail.component.scss']
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  application: ExtendedUserApplication | null = null;
  isLoading = true;
  error: string | null = null;
  
  private applicationId!: string;
  private applicationType!: string;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.applicationId = params['id'];
      this.applicationType = params['type'];
      this.loadApplication();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplication(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.getApplication(this.applicationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (application: UserApplication | null) => {
        // Cast vers le type étendu
        this.application = application as ExtendedUserApplication;
        this.isLoading = false;
      },
      error: (error: { message: string; }) => {
        this.error = error.message || 'Demande introuvable';
        this.isLoading = false;
      }
    });
  }

  canModifyApplication(): boolean {
    return this.application ? ['pending', 'under_review'].includes(this.application.status) : false;
  }

  canCancelApplication(): boolean {
    return this.application ? ['pending', 'under_review'].includes(this.application.status) : false;
  }

  editApplication(): void {
    if (!this.application || !this.canModifyApplication()) return;

    this.router.navigate(['/apply', this.application.type], {
      queryParams: { edit: this.application.id }
    });
  }

  cancelApplication(): void {
    if (!this.application || !this.canCancelApplication()) return;

    const confirmMessage = `Êtes-vous sûr de vouloir annuler votre demande "${this.application.product_name}" ?`;
    
    if (confirm(confirmMessage)) {
      this.authService.cancelApplication(this.application.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          if (this.application) {
            this.application.status = 'cancelled';
          }
          this.notificationService.showSuccess('Demande annulée avec succès');
        },
        error: (error: any) => {
          this.notificationService.showError('Erreur lors de l\'annulation');
        }
      });
    }
  }

  downloadDocument(document: any): void {
    this.authService.downloadDocument(document.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        this.notificationService.showError('Erreur lors du téléchargement');
      }
    });
  }

  isStepCompleted(step: string): boolean {
    if (!this.application) return false;

    const status = this.application.status;
    
    switch (step) {
      case 'submitted':
        return true; // Always completed if we have the application
      case 'under_review':
        return ['under_review', 'approved', 'rejected'].includes(status);
      case 'decision':
        return ['approved', 'rejected'].includes(status);
      default:
        return false;
    }
  }

  getNextSteps(): Array<{icon: string, title: string, description: string}> {
    if (!this.application) return [];

    const steps: Array<{icon: string, title: string, description: string}> = [];

    switch (this.application.status) {
      case 'pending':
        steps.push({
          icon: '⏳',
          title: 'Attente de traitement',
          description: 'Votre demande sera étudiée dans les prochains jours ouvrables'
        });
        break;
      case 'under_review':
        steps.push({
          icon: '📞',
          title: 'Possible contact',
          description: 'Un conseiller pourrait vous contacter pour des informations complémentaires'
        });
        break;
      case 'approved':
        steps.push({
          icon: '📝',
          title: 'Signature du contrat',
          description: 'Prenez rendez-vous avec votre conseiller pour finaliser'
        });
        break;
    }

    return steps;
  }

  // ==================== MÉTHODES HELPER ====================

  hasDocuments(): boolean {
    return !!(this.application?.documents && this.application.documents.length > 0);
  }

  hasMessages(): boolean {
    return !!(this.application?.messages && this.application.messages.length > 0);
  }

  hasContactInfo(): boolean {
    return !!(this.application?.assigned_advisor || 
             this.application?.advisor_phone || 
             this.application?.advisor_email);
  }

  // ==================== GETTERS POUR LES PROPRIÉTÉS ====================

  get applicationDuration(): number {
    return this.application?.duration || 0;
  }

  get applicationMonthlyPayment(): number {
    return this.application?.monthly_payment || 0;
  }

  get applicationInterestRate(): number {
    return this.application?.interest_rate || 0;
  }

  get applicationMonthlyAmount(): number {
    return this.application?.monthly_amount || 0;
  }

  get applicationExpectedReturn(): number {
    return this.application?.expected_return || 0;
  }

  get applicationCoverageType(): string {
    return this.application?.coverage_type || '-';
  }

  get applicationMonthlyPremium(): number {
    return this.application?.monthly_premium || 0;
  }

  get applicationDeductible(): number {
    return this.application?.deductible || 0;
  }

  get applicationReferenceNumber(): string {
    return this.application?.reference_number || 
           (this.application?.id ? this.application.id.substring(0, 8) : '-');
  }

  get applicationAssignedAdvisor(): string {
    return this.application?.assigned_advisor || 'Non assigné';
  }

  get applicationAdvisorPhone(): string {
    return this.application?.advisor_phone || '';
  }

  get applicationAdvisorEmail(): string {
    return this.application?.advisor_email || '';
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  getTypeName(type: string): string {
    const typeNames = {
      'credit': 'Crédit',
      'savings': 'Épargne',
      'insurance': 'Assurance'
    };
    return typeNames[type as keyof typeof typeNames] || type;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'under_review': 'En cours d\'étude',
      'approved': 'Approuvée',
      'rejected': 'Refusée',
      'cancelled': 'Annulée',
      'on_hold': 'En suspens'
    };
    return statusLabels[status] || status;
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  }

  formatPercent(rate: number | undefined): string {
    if (!rate) return '-';
    return `${rate.toFixed(1)}%`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  }

  formatFullDate(date: string | Date | undefined): string {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }
}