// src/app/user/application-history.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, UserApplication } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-application-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="applications-container">
      <div class="container">
        
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>Mes Demandes</h1>
            <p>Suivez le statut de toutes vos demandes</p>
          </div>
          
          <div class="header-actions">
            <select [(ngModel)]="selectedType" (ngModelChange)="applyFilters()" class="filter-select">
              <option value="">Tous les types</option>
              <option value="credit">Crédit</option>
              <option value="savings">Épargne</option>
              <option value="insurance">Assurance</option>
            </select>
            
            <div class="dropdown">
              <button class="btn-primary dropdown-toggle">
                Nouvelle demande
              </button>
              <div class="dropdown-menu">
                <a routerLink="/apply/credit" class="dropdown-item">Demande de crédit</a>
                <a routerLink="/apply/savings" class="dropdown-item">Produit d'épargne</a>
                <a routerLink="/apply/insurance" class="dropdown-item">Assurance</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtres -->
        <div class="filters-section">
          <div class="filter-buttons">
            <button 
              *ngFor="let status of statusFilters"
              [class.active]="selectedStatus === status.value"
              (click)="setStatusFilter(status.value)"
              class="filter-btn"
              [class]="status.value">
              <span class="status-dot" [class]="status.value"></span>
              {{ status.label }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="applications-content">
          
          <!-- Loading state -->
          <div *ngIf="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Chargement des demandes...</p>
          </div>

          <!-- Empty state -->
          <div *ngIf="!isLoading && filteredApplications.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <h2>Aucune demande trouvée</h2>
            <p *ngIf="searchTerm || selectedType || selectedStatus">Essayez de modifier vos filtres</p>
            <p *ngIf="!searchTerm && !selectedType && !selectedStatus">
              Vous n'avez pas encore soumis de demandes
            </p>
            <div class="empty-actions">
              <a routerLink="/apply/credit" class="btn-primary">Demande de crédit</a>
              <a routerLink="/apply/savings" class="btn-outline">Produit d'épargne</a>
            </div>
          </div>

          <!-- Applications list -->
          <div *ngIf="!isLoading && filteredApplications.length > 0" class="applications-list">
            <div 
              *ngFor="let application of filteredApplications" 
              class="application-card"
              [class]="application.type"
              (click)="viewApplication(application)">
              
              <div class="card-header">
                <div class="application-type">
                  <div class="type-icon" [class]="application.type">
                    <span *ngIf="application.type === 'credit'">💳</span>
                    <span *ngIf="application.type === 'savings'">💰</span>
                    <span *ngIf="application.type === 'insurance'">🛡️</span>
                  </div>
                  <div class="type-info">
                    <h3 class="application-title">{{ application.product_name }}</h3>
                    <p class="bank-name">{{ application.bank_or_company_name }}</p>
                  </div>
                </div>
                
                <div class="status-badge" [class]="application.status">
                  {{ getStatusLabel(application.status) }}
                </div>
              </div>

              <div class="card-content">
                <div class="application-details">
                  
                  <!-- Credit details -->
                  <div *ngIf="application.type === 'credit'" class="detail-row">
                    <div class="detail-item">
                      <label>Montant demandé</label>
                      <span class="value">{{ formatCurrency(application.amount) }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Durée</label>
                      <span class="value">{{ application.duration }} mois</span>
                    </div>
                    <div class="detail-item" *ngIf="application.monthly_payment">
                    <label>Mensualité estimée</label>
                    <span class="value">{{ formatCurrency(application.monthly_payment) }}</span>
                    </div>
                  </div>

                  <!-- Savings details -->
                  <div *ngIf="application.type === 'savings'" class="detail-row">
                    <div class="detail-item">
                      <label>Montant initial</label>
                      <span class="value">{{ formatCurrency(application.amount) }}</span>
                    </div>
                    <div class="detail-item" *ngIf="application.monthly_amount">
                    <label>Épargne mensuelle</label>
                    <span class="value">{{ formatCurrency(application.monthly_amount) }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Durée</label>
                      <span class="value">{{ application.duration }} mois</span>
                    </div>
                  </div>

                  <!-- Insurance details -->
                  <div *ngIf="application.type === 'insurance'" class="detail-row">
                    <div class="detail-item">
                      <label>Type de couverture</label>
                      <span class="value">{{ application.coverage_type }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Montant assuré</label>
                      <span class="value">{{ formatCurrency(application.amount) }}</span>
                    </div>
                    <div class="detail-item" *ngIf="application.monthly_premium">
                    <label>Prime mensuelle</label>
                    <span class="value">{{ formatCurrency(application.monthly_premium) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Timeline -->
                <div class="application-timeline">
                  <div class="timeline-item">
                    <div class="timeline-dot submitted"></div>
                    <div class="timeline-content">
                      <span class="timeline-label">Soumise</span>
                      <span class="timeline-date">{{ formatDate(application.submitted_at) }}</span>
                    </div>
                  </div>
                  
                  <div 
                    *ngIf="application.status !== 'pending'" 
                    class="timeline-item">
                    <div class="timeline-dot" [class]="application.status"></div>
                    <div class="timeline-content">
                      <span class="timeline-label">{{ getStatusLabel(application.status) }}</span>
                      <span class="timeline-date">{{ formatDate(application.updated_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="application-id">
                  Réf: {{ application.reference_number || application.id.substring(0, 8) }}
                </div>
                
                <div class="card-actions">
                  <button 
                    (click)="viewApplication(application, $event)" 
                    class="action-btn primary">
                    Voir détails
                  </button>
                  
                  <button 
                    *ngIf="canModifyApplication(application)"
                    (click)="editApplication(application, $event)" 
                    class="action-btn">
                    Modifier
                  </button>
                  
                  <button 
                    *ngIf="canCancelApplication(application)"
                    (click)="cancelApplication(application, $event)" 
                    class="action-btn danger">
                    Annuler
                  </button>
                </div>
              </div>

              <!-- Progress indicator -->
              <div class="progress-indicator">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width.%]="getProgressPercentage(application.status)">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./application-history.component.scss']
})
export class ApplicationHistoryComponent implements OnInit, OnDestroy {
  applications: UserApplication[] = [];
  filteredApplications: UserApplication[] = [];
  
  isLoading = true;
  selectedType = '';
  selectedStatus = '';
  searchTerm = '';

  statusFilters = [
    { value: '', label: 'Toutes', color: 'all' },
    { value: 'pending', label: 'En attente', color: 'pending' },
    { value: 'under_review', label: 'En cours', color: 'review' },
    { value: 'approved', label: 'Approuvées', color: 'approved' },
    { value: 'rejected', label: 'Refusées', color: 'rejected' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications(): void {
    this.isLoading = true;
    
    this.authService.getUserApplications().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (applications) => {
        this.applications = applications;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des demandes:', error);
        this.notificationService.showError('Erreur lors du chargement des demandes');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.applications];

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(app => app.type === this.selectedType);
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(app => app.status === this.selectedStatus);
    }

    // Tri par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    this.filteredApplications = filtered;
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  viewApplication(application: UserApplication, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/applications', application.type, application.id]);
  }

  editApplication(application: UserApplication, event: Event): void {
    event.stopPropagation();
    
    if (!this.canModifyApplication(application)) {
      this.notificationService.showError('Cette demande ne peut plus être modifiée');
      return;
    }

    this.router.navigate(['/apply', application.type], {
      queryParams: { edit: application.id }
    });
  }

  cancelApplication(application: UserApplication, event: Event): void {
    event.stopPropagation();
    
    if (!this.canCancelApplication(application)) {
      this.notificationService.showError('Cette demande ne peut plus être annulée');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir annuler votre demande "${application.product_name}" ?`;
    
    if (confirm(confirmMessage)) {
      this.authService.cancelApplication(application.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          application.status = 'cancelled';
          this.notificationService.showSuccess('Demande annulée avec succès');
        },
        error: (error: any) => {
          this.notificationService.showError('Erreur lors de l\'annulation');
        }
      });
    }
  }

  canModifyApplication(application: UserApplication): boolean {
    return ['pending', 'under_review'].includes(application.status);
  }

  canCancelApplication(application: UserApplication): boolean {
    return ['pending', 'under_review'].includes(application.status);
  }

  getProgressPercentage(status: string): number {
    const progressMap: { [key: string]: number } = {
      'pending': 25,
      'under_review': 50,
      'approved': 100,
      'rejected': 75,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  }

  // Méthodes utilitaires
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'under_review': 'En cours d\'étude',
      'approved': 'Approuvée',
      'rejected': 'Refusée',
      'cancelled': 'Annulée',
      'on_hold': 'En suspens',
      'completed': 'Terminée'
    };
    return statusLabels[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Aujourd'hui";
    } else if (diffInDays === 1) {
      return "Hier";
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  }
}