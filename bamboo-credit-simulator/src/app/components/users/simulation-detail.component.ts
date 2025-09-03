// src/app/user/simulation-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, UserSimulation } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';



@Component({
  selector: 'app-simulation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="simulation-detail-container">
      <div class="container">
        
        <!-- Loading state -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Chargement de la simulation...</p>
        </div>

        <!-- Error state -->
        <div *ngIf="error && !isLoading" class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Erreur</h2>
          <p>{{ error }}</p>
          <button routerLink="/simulations" class="btn-primary">
            Retour aux simulations
          </button>
        </div>

        <!-- Simulation details -->
        <div *ngIf="simulation && !isLoading" class="simulation-content">
          
          <!-- Header -->
          <div class="detail-header">
            <div class="header-info">
              <div class="breadcrumb">
                <a routerLink="/simulations">Mes simulations</a>
                <span class="separator">›</span>
                <span>{{ getTypeName(simulation.type) }}</span>
              </div>
              
              <div class="simulation-title">
                <div class="title-icon" [class]="simulation.type">
                  <span *ngIf="simulation.type === 'credit'">💳</span>
                  <span *ngIf="simulation.type === 'savings'">💰</span>
                  <span *ngIf="simulation.type === 'insurance'">🛡️</span>
                </div>
                <div class="title-content">
                  <h1>{{ simulation.name }}</h1>
                  <p class="simulation-subtitle">
                    {{ simulation.bank_or_company_name }} • 
                    {{ formatDate(simulation.created_at) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="header-actions">
              <button (click)="duplicateSimulation()" class="btn-outline">
                📋 Dupliquer
              </button>
              <button (click)="createApplication()" class="btn-primary">
                📝 Faire une demande
              </button>
            </div>
          </div>

          <!-- Status badge -->
          <div class="status-section">
            <span class="status-badge" [class]="simulation.status">
              {{ getStatusLabel(simulation.status) }}
            </span>
          </div>

          <!-- Main content grid -->
          <div class="detail-grid">
            
            <!-- Left column: Parameters and results -->
            <div class="main-column">
              
              <!-- Parameters -->
              <div class="detail-card">
                <div class="card-header">
                  <h2>Paramètres de simulation</h2>
                </div>
                <div class="card-body">
                  <div class="parameters-grid">
                    
                    <!-- Credit parameters -->
                    <div *ngIf="simulation.type === 'credit'" class="parameter-section">
                      <div class="param-item">
                        <label>Montant du crédit</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['amount']) }}</span>
                      </div>
                      <div class="param-item">
                        <label>Durée</label>
                        <span class="value">{{ simulation.parameters?.['duration'] }} mois</span>
                      </div>
                      <div class="param-item">
                        <label>Revenus mensuels</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['monthly_income']) }}</span>
                      </div>
                      <div class="param-item" *ngIf="simulation.parameters?.['down_payment']">
                        <label>Apport personnel</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['down_payment']) }}</span>
                      </div>
                      <div class="param-item" *ngIf="simulation.parameters?.['current_debts']">
                        <label>Dettes actuelles</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['current_debts']) }}</span>
                      </div>
                    </div>

                    <!-- Savings parameters -->
                    <div *ngIf="simulation.type === 'savings'" class="parameter-section">
                      <div class="param-item">
                        <label>Épargne mensuelle</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['monthly_amount']) }}</span>
                      </div>
                      <div class="param-item">
                        <label>Durée d'épargne</label>
                        <span class="value">{{ simulation.parameters?.['duration'] }} mois</span>
                      </div>
                      <div class="param-item" *ngIf="simulation.parameters?.['initial_amount']">
                        <label>Montant initial</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['initial_amount']) }}</span>
                      </div>
                      <div class="param-item">
                        <label>Objectif</label>
                        <span class="value">{{ simulation.parameters?.['goal'] || 'Non défini' }}</span>
                      </div>
                    </div>

                    <!-- Insurance parameters -->
                    <div *ngIf="simulation.type === 'insurance'" class="parameter-section">
                      <div class="param-item">
                        <label>Type de couverture</label>
                        <span class="value">{{ simulation.parameters?.['coverage_type'] }}</span>
                      </div>
                      <div class="param-item">
                        <label>Montant assuré</label>
                       <span class="value">{{ formatCurrency(simulation.parameters?.['coverage_amount']) }}</span>
                      </div>
                      <div class="param-item" *ngIf="simulation.parameters?.['deductible']">
                        <label>Franchise</label>
                        <span class="value">{{ formatCurrency(simulation.parameters?.['deductible']) }}</span>
                      </div>
                      <div class="param-item" *ngIf="simulation.parameters?.['age']">
                        <label>Âge</label>
                        <span class="value">{{ simulation.parameters?.['age'] }} ans</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Results -->
              <div class="detail-card">
                <div class="card-header">
                  <h2>Résultats de simulation</h2>
                </div>
                <div class="card-body">
                  
                  <!-- Credit results -->
                  <div *ngIf="simulation.type === 'credit'" class="results-section">
                    <div class="result-highlight">
                      <div class="highlight-item">
                        <label>Mensualité</label>
                        <span class="value primary">{{ formatCurrency(simulation.result_summary?.monthly_payment) }}</span>
                      </div>
                      <div class="highlight-item">
                        <label>Taux d'intérêt</label>
                        <span class="value">{{ formatPercent(simulation.result_summary?.interest_rate) }}</span>
                      </div>
                      <div class="highlight-item">
                        <label>Coût total</label>
                        <span class="value">{{ formatCurrency(simulation.result_summary?.total_cost) }}</span>
                      </div>
                    </div>
                    
                    <div class="additional-results">
                      <div class="result-item">
                        <label>Taux d'endettement</label>
                        <span class="value">{{ formatPercent(simulation.result_summary?.debt_ratio) }}</span>
                      </div>
                      <div class="result-item">
                        <label>Reste à vivre</label>
                        <span class="value">{{ formatCurrency(simulation.result_summary?.remaining_income) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Savings results -->
                  <div *ngIf="simulation.type === 'savings'" class="results-section">
                    <div class="result-highlight">
                      <div class="highlight-item">
                        <label>Montant final</label>
                        <span class="value primary">{{ formatCurrency(simulation.result_summary?.final_amount) }}</span>
                      </div>
                      <div class="highlight-item">
                        <label>Rendement annuel</label>
                        <span class="value">{{ formatPercent(simulation.result_summary?.annual_return) }}</span>
                      </div>
                      <div class="highlight-item">
                        <label>Plus-value</label>
                        <span class="value">{{ formatCurrency(simulation.result_summary?.capital_gain) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Insurance results -->
                  <div *ngIf="simulation.type === 'insurance'" class="results-section">
                    <div class="result-highlight">
                      <div class="highlight-item">
                        <label>Prime mensuelle</label>
                        <span class="value">{{ formatCurrency(simulation.result_summary?.monthly_premium) }}</span>
                      </div>
                      <div class="highlight-item">
                        <label>Prime annuelle</label>
                        <span class="value">{{ formatCurrency(simulation.result_summary?.annual_premium) }}</span>
                      </div>
                      <div class="highlight-item">
                        <label>Couverture</label>
                        <span class="value">{{ formatCurrency(simulation.result_summary?.['coverage_amount']) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Chart section (if available) -->
              <div *ngIf="simulation['chart_data']" class="detail-card">
                <div class="card-header">
                  <h2>Graphique</h2>
                </div>
                <div class="card-body">
                  <div class="chart-placeholder">
                    <p>Graphique des résultats</p>
                    <small>Fonctionnalité en développement</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right column: Additional info -->
            <div class="sidebar-column">
              
              <!-- Actions -->
              <div class="detail-card">
                <div class="card-header">
                  <h3>Actions</h3>
                </div>
                <div class="card-body">
                  <div class="action-buttons">
                    <button (click)="createApplication()" class="action-btn primary">
                      📝 Créer une demande
                    </button>
                    <button (click)="duplicateSimulation()" class="action-btn">
                      📋 Dupliquer
                    </button>
                    <button (click)="downloadSimulation()" class="action-btn">
                      💾 Télécharger PDF
                    </button>
                    <button (click)="shareSimulation()" class="action-btn">
                      📤 Partager
                    </button>
                  </div>
                </div>
              </div>

              <!-- Metadata -->
              <div class="detail-card">
                <div class="card-header">
                  <h3>Informations</h3>
                </div>
                <div class="card-body">
                  <div class="metadata-list">
                    <div class="meta-item">
                      <label>ID Simulation</label>
                      <span class="value">{{ simulation.id }}</span>
                    </div>
                    <div class="meta-item">
                      <label>Date de création</label>
                      <span class="value">{{ formatFullDate(simulation.created_at) }}</span>
                    </div>
                    <div class="meta-item" *ngIf="simulation['updated_at'] !== simulation.created_at">
                      <label>Dernière modification</label>
                      <span class="value">{{ simulation['updated_at'] ? formatFullDate(simulation['updated_at']) : 'Non disponible' }}</span>
                    </div>
                    <div class="meta-item">
                      <label>Statut</label>
                      <span class="value">{{ getStatusLabel(simulation.status) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recommendations -->
              <div *ngIf="simulation['recommendations']?.length" class="detail-card">
                <div class="card-header">
                  <h3>Recommandations</h3>
                </div>
                <div class="card-body">
                  <div class="recommendations-list">
                    <div *ngFor="let recommendation of simulation['recommendations']" class="recommendation-item">
                      <div class="recommendation-icon">💡</div>
                      <p>{{ recommendation }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Alternative offers -->
              <div *ngIf="simulation['alternative_offers']?.length" class="detail-card">
                <div class="card-header">
                  <h3>Offres alternatives</h3>
                </div>
                <div class="card-body">
                  <div class="alternatives-list">
                    <div *ngFor="let offer of simulation['alternative_offers']" class="alternative-item">
                      <div class="offer-header">
                        <strong>{{ offer.bank_name }}</strong>
                        <span class="offer-rate">{{ formatPercent(offer.rate) }}</span>
                      </div>
                      <p class="offer-description">{{ offer.description }}</p>
                      <button class="btn-sm btn-outline">Voir détails</button>
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
  styleUrls: ['./simulation-detail.component.scss']
})
export class SimulationDetailComponent implements OnInit, OnDestroy {
  simulation: UserSimulation | null = null;
  isLoading = true;
  error: string | null = null;
  
  private simulationId!: string;
  private simulationType!: string;
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
      this.simulationId = params['id'];
      this.simulationType = params['type'] || this.route.snapshot.url[1]?.path;
      this.loadSimulation();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSimulation(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.getSimulation(this.simulationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (simulation: UserSimulation | null) => {
        this.simulation = simulation;
        this.isLoading = false;
      },
      error: (error: { message: string; }) => {
        this.error = error.message || 'Simulation introuvable';
        this.isLoading = false;
      }
    });
  }

  createApplication(): void {
    if (!this.simulation) return;

    this.router.navigate(['/apply', this.simulation.type], {
      queryParams: {
        simulation_id: this.simulation.id,
        product_name: this.simulation.product_name,
        bank_name: this.simulation.bank_or_company_name
      }
    });
  }

  duplicateSimulation(): void {
    if (!this.simulation) return;

    const routeMap = {
      'credit': '/borrowing-capacity',
      'savings': '/savings-simulator',
      'insurance': '/insurance-comparator'
    };

    const route = routeMap[this.simulation.type as keyof typeof routeMap];
    if (route) {
      this.router.navigate([route], { 
        queryParams: { 
          duplicate: this.simulation.id,
          ...this.simulation.parameters 
        }
      });
    }
  }

  downloadSimulation(): void {
    if (!this.simulation) return;

    this.authService.downloadSimulation(this.simulation.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `simulation-${this.simulation!.type}-${this.simulation!.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.notificationService.showSuccess('Simulation téléchargée');
      },
      error: (error: any) => {
        this.notificationService.showError('Erreur lors du téléchargement');
      }
    });
  }

  shareSimulation(): void {
    if (!this.simulation) return;

    if (navigator.share) {
      navigator.share({
        title: `Simulation ${this.getTypeName(this.simulation.type)}`,
        text: `Ma simulation ${this.simulation.product_name} chez ${this.simulation.bank_or_company_name}`,
        url: window.location.href
      });
    } else {
      // Fallback: copier l'URL dans le presse-papier
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.notificationService.showSuccess('Lien copié dans le presse-papier');
      });
    }
  }

  // Méthodes utilitaires
  getTypeName(type: string): string {
    const typeNames = {
      'credit': 'Crédit',
      'savings': 'Épargne', 
      'insurance': 'Assurance'
    };
    return typeNames[type as keyof typeof typeNames] || type;
  }

  getStatusLabel(status: string): string {
    const statusLabels = {
      'completed': 'Terminée',
      'saved': 'Sauvegardée',
      'shared': 'Partagée',
      'draft': 'Brouillon'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
}