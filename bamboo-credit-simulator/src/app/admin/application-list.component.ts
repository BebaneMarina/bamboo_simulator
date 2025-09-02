import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminApiService } from '../services/admin-api.service';
import { AdminAuthService } from '../services/admin-auth.services';
import { NotificationService } from '../services/notification.service';
import { CreditApplication, PaginatedResponse } from '../models/interfaces';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Demandes Clients</h1>
          <p>Gérez les demandes de crédit et d'assurance des clients</p>
        </div>
        <div class="header-actions">
          <button (click)="exportApplications()" class="btn btn-outline">
            <i class="fas fa-download"></i>
            Exporter
          </button>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="stats-section">
        <div class="stat-card pending">
          <div class="stat-value">{{ getPendingCount() }}</div>
          <div class="stat-label">En attente</div>
        </div>
        <div class="stat-card approved">
          <div class="stat-value">{{ getApprovedCount() }}</div>
          <div class="stat-label">Approuvées</div>
        </div>
        <div class="stat-card rejected">
          <div class="stat-value">{{ getRejectedCount() }}</div>
          <div class="stat-label">Refusées</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ getAverageProcessingTime() }}j</div>
          <div class="stat-label">Délai moyen</div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-section">
        <form [formGroup]="filtersForm" class="filters-form">
          <div class="filter-group">
            <label for="search">Rechercher</label>
            <input 
              type="text" 
              id="search"
              formControlName="search" 
              placeholder="Nom, email, téléphone..."
              class="form-input">
          </div>
          
          <div class="filter-group">
            <label for="status">Statut</label>
            <select formControlName="status" id="status" class="form-select">
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="under_review">En cours d'examen</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Refusé</option>
              <option value="completed">Finalisé</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="priority">Priorité</label>
            <select formControlName="priority" id="priority" class="form-select">
              <option value="">Toutes</option>
              <option value="low">Faible</option>
              <option value="normal">Normale</option>
              <option value="high">Élevée</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="bank">Banque</label>
            <select formControlName="bank_id" id="bank" class="form-select">
              <option value="">Toutes les banques</option>
              <option *ngFor="let bank of banks" [value]="bank.id">
                {{ bank.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateRange">Période</label>
            <select formControlName="date_range" id="dateRange" class="form-select">
              <option value="">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>

          <button type="button" (click)="resetFilters()" class="btn btn-outline">
            Réinitialiser
          </button>
        </form>
      </div>

      <!-- Liste des demandes -->
      <div class="content-section">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des demandes...</p>
        </div>

        <div *ngIf="!loading && applications.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <h3>Aucune demande trouvée</h3>
          <p>Aucune demande ne correspond aux critères sélectionnés</p>
        </div>

        <div *ngIf="!loading && applications.length > 0" class="applications-table">
          <table class="data-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allSelected">
                </th>
                <th>Client</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Banque</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Date</th>
                <th>Délai</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let application of applications" 
                  class="application-row"
                  [class.selected]="selectedApplications.has(application.id)">
                <td>
                  <input 
                    type="checkbox" 
                    [checked]="selectedApplications.has(application.id)"
                    (change)="toggleSelect(application.id, $event)">
                </td>
                <td>
                  <div class="client-info">
                    <div class="client-name">{{ application.applicant_name || 'N/A' }}</div>
                    <div class="client-contact">
                      <span class="email">{{ application.applicant_email || 'N/A' }}</span>
                      <span class="phone">{{ application.applicant_phone || 'N/A' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="application-type">
                    <span class="type-badge" [class]="getApplicationType(application)">
                      {{ getApplicationTypeLabel(application) }}
                    </span>
                    <div class="amount-small">{{ formatCurrency(application.requested_amount) }}</div>
                  </div>
                </td>
                <td>
                  <div class="amount-info">
                    <div class="amount">{{ formatCurrency(application.requested_amount) }}</div>
                    <div class="duration" *ngIf="application.duration_months">
                          {{ application.duration_months }} mois
                    </div>
                  </div>
                </td>
                <td>
                  <div class="bank-info">
                    <img *ngIf="getBankLogo(application)" 
                         [src]="getBankLogo(application)" 
                         [alt]="getBankName(application)"
                         class="bank-logo-small">
                    <span>{{ getBankName(application) }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class]="application.status">
                    {{ getStatusLabel(application.status) }}
                  </span>
                </td>
                <td>
                  <span class="priority-badge" [class]="getPriority(application)">
                    {{ getPriorityLabel(getPriority(application)) }}
                  </span>
                </td>
                <td>
                  <div class="date-info">
                    <div class="date">{{ formatDate(application.created_at.toString()) }}</div>
                    <div class="time">{{ formatTime(application.created_at.toString()) }}</div>         
                  </div>
                </td>
                <td>
                  <div class="deadline" [class]="getDeadlineClass(application)">
                    {{ getProcessingTimeText(application) }}
                  </div>
                </td>
                <td>
                  <div class="actions-menu">
                    <button 
                      [routerLink]="['/admin/applications', application.id]"
                      class="btn btn-outline btn-sm"
                      title="Voir détails">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      *ngIf="canUpdate && application.status === 'pending'"
                      (click)="quickApprove(application)"
                      class="btn btn-success btn-sm"
                      title="Approuver">
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      *ngIf="canUpdate && application.status === 'pending'"
                      (click)="quickReject(application)"
                      class="btn btn-danger btn-sm"
                      title="Refuser">
                      <i class="fas fa-times"></i>
                    </button>
                    <div class="dropdown">
                      <button class="btn btn-outline btn-sm dropdown-toggle" (click)="toggleDropdown(application.id)">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <div class="dropdown-menu" *ngIf="openDropdown === application.id">
                        <button (click)="assignApplication(application)">
                          <i class="fas fa-user"></i> Assigner
                        </button>
                        <button (click)="addComment(application)">
                          <i class="fas fa-comment"></i> Commenter
                        </button>
                        <button (click)="changeStatus(application)">
                          <i class="fas fa-edit"></i> Changer statut
                        </button>
                        <button (click)="exportApplication(application)">
                          <i class="fas fa-download"></i> Exporter
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions groupées -->
        <div *ngIf="selectedApplications.size > 0" class="bulk-actions">
          <div class="bulk-info">
            {{ selectedApplications.size }} demande(s) sélectionnée(s)
          </div>
          <div class="bulk-buttons">
            <button (click)="bulkApprove()" class="btn btn-success btn-sm">
              <i class="fas fa-check"></i>
              Approuver la sélection
            </button>
            <button (click)="bulkReject()" class="btn btn-danger btn-sm">
              <i class="fas fa-times"></i>
              Refuser la sélection
            </button>
            <button (click)="bulkAssign()" class="btn btn-primary btn-sm">
              <i class="fas fa-user"></i>
              Assigner
            </button>
            <button (click)="bulkExport()" class="btn btn-outline btn-sm">
              <i class="fas fa-download"></i>
              Exporter
            </button>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination && pagination.total > pagination.limit" class="pagination-section">
          <div class="pagination-info">
            Affichage de {{ getPaginationStart() }} à {{ getPaginationEnd() }} 
            sur {{ pagination.total }} demandes
          </div>
          <div class="pagination-controls">
            <button 
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage <= 1"
              class="btn btn-outline btn-sm">
              Précédent
            </button>
            
            <span class="page-numbers">
              <button 
                *ngFor="let page of getPageNumbers()"
                (click)="goToPage(page)"
                [class.active]="page === currentPage"
                class="btn btn-outline btn-sm">
                {{ page }}
              </button>
            </span>
            
            <button 
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage >= getTotalPages()"
              class="btn btn-outline btn-sm">
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals pour actions rapides -->
    <div *ngIf="showStatusModal" class="modal-overlay" (click)="closeStatusModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Changer le statut</h3>
          <button (click)="closeStatusModal()" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="newStatus">Nouveau statut</label>
            <select [(ngModel)]="newStatus" id="newStatus" class="form-select">
              <option value="pending">En attente</option>
              <option value="under_review">En cours d'examen</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Refusé</option>
              <option value="completed">Finalisé</option>
            </select>
          </div>
          <div class="form-group">
            <label for="comment">Commentaire</label>
            <textarea [(ngModel)]="statusComment" id="comment" class="form-textarea" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button (click)="closeStatusModal()" class="btn btn-outline">
            Annuler
          </button>
          <button (click)="confirmStatusChange()" class="btn btn-primary">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  `,
  //styleUrls: ['./applications-list.component.scss']
})
export class ApplicationsListComponent implements OnInit {
  applications: CreditApplication[] = [];
  banks: any[] = [];
  loading = false;
  filtersForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  pageSize = 15;
  pagination: any = null;

  // Sélection multiple
  selectedApplications = new Set<string>();
  allSelected = false;

  // Dropdown et modals
  openDropdown: string | null = null;
  showStatusModal = false;
  currentApplication: CreditApplication | null = null;
  newStatus = '';
  statusComment = '';

  constructor(
    private adminApi: AdminApiService,
    private adminAuth: AdminAuthService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      bank_id: [''],
      date_range: ['']
    });
  }

  ngOnInit(): void {
    this.loadBanks();
    this.loadApplications();
    this.setupFilters();
  }

  private setupFilters(): void {
    this.filtersForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadApplications();
    });
  }

  loadBanks(): void {
    this.adminApi.getBanks().subscribe({
      next: (response) => {
        this.banks = response.items || response;
      },
      error: (error) => {
        console.error('Erreur chargement banques:', error);
      }
    });
  }

  loadApplications(): void {
    this.loading = true;
    const filters = this.filtersForm.value;
    
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      ...filters
    };

    this.adminApi.getCreditApplications(params).subscribe({
      next: (response: PaginatedResponse<CreditApplication>) => {
        this.applications = response.items;
        this.pagination = {
          total: response.total,
          page: response.page,
          limit: response.limit,
          pages: response.pages
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demandes:', error);
        this.notificationService.showError('Erreur lors du chargement des demandes');
        this.loading = false;
      }
    });
  }

  resetFilters(): void {
    this.filtersForm.reset();
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadApplications();
    }
  }

  // Gestion de la sélection multiple
  toggleSelectAll(event: any): void {
    this.allSelected = event.target.checked;
    this.selectedApplications.clear();
    
    if (this.allSelected) {
      this.applications.forEach(app => this.selectedApplications.add(app.id));
    }
  }

  toggleSelect(applicationId: string, event: any): void {
    if (event.target.checked) {
      this.selectedApplications.add(applicationId);
    } else {
      this.selectedApplications.delete(applicationId);
    }
    
    this.allSelected = this.selectedApplications.size === this.applications.length;
  }

  // Actions rapides
  quickApprove(application: CreditApplication): void {
    this.updateApplicationStatus(application.id, 'approved', 'Approuvé automatiquement');
  }

  quickReject(application: CreditApplication): void {
    this.updateApplicationStatus(application.id, 'rejected', 'Refusé automatiquement');
  }

  private updateApplicationStatus(id: string, status: string, comment: string): void {
    this.adminApi.updateCreditApplication(id, { status, comment }).subscribe({
      next: () => {
        this.notificationService.showSuccess(`Demande ${status === 'approved' ? 'approuvée' : 'refusée'}`);
        this.loadApplications();
      },
      error: (error) => {
        console.error('Erreur mise à jour:', error);
        this.notificationService.showError('Erreur lors de la mise à jour');
      }
    });
  }

  // Gestion des dropdowns et modals
  toggleDropdown(applicationId: string): void {
    this.openDropdown = this.openDropdown === applicationId ? null : applicationId;
  }

  changeStatus(application: CreditApplication): void {
    this.currentApplication = application;
    this.newStatus = application.status;
    this.statusComment = '';
    this.showStatusModal = true;
    this.openDropdown = null;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.currentApplication = null;
  }

  confirmStatusChange(): void {
    if (this.currentApplication) {
      this.updateApplicationStatus(this.currentApplication.id, this.newStatus, this.statusComment);
      this.closeStatusModal();
    }
  }

  // Actions groupées
  bulkApprove(): void {
    this.bulkUpdateStatus('approved', 'Approuvé en lot');
  }

  bulkReject(): void {
    this.bulkUpdateStatus('rejected', 'Refusé en lot');
  }

  private bulkUpdateStatus(status: string, comment: string): void {
    const promises = Array.from(this.selectedApplications).map(id => 
      this.adminApi.updateCreditApplication(id, { status, comment }).toPromise()
    );

    Promise.all(promises).then(() => {
      this.notificationService.showSuccess(`${this.selectedApplications.size} demandes mises à jour`);
      this.selectedApplications.clear();
      this.allSelected = false;
      this.loadApplications();
    }).catch(error => {
      console.error('Erreur mise à jour groupée:', error);
      this.notificationService.showError('Erreur lors de la mise à jour groupée');
    });
  }

  bulkAssign(): void {
    this.notificationService.showInfo('Fonction d\'assignation en développement');
  }

  bulkExport(): void {
    this.notificationService.showSuccess('Export des demandes sélectionnées en cours...');
  }

  // Autres actions
  assignApplication(application: CreditApplication): void {
    this.notificationService.showInfo('Fonction d\'assignation en développement');
    this.openDropdown = null;
  }

  addComment(application: CreditApplication): void {
    this.notificationService.showInfo('Fonction de commentaire en développement');
    this.openDropdown = null;
  }

  exportApplication(application: CreditApplication): void {
    this.notificationService.showSuccess('Export de la demande en cours...');
    this.openDropdown = null;
  }

  exportApplications(): void {
    this.notificationService.showSuccess('Export de toutes les demandes en cours...');
  }

  // Getters pour les permissions
  get canUpdate(): boolean {
    return this.adminAuth.hasPermission('applications', 'update');
  }

  // Méthodes utilitaires
  getPendingCount(): number {
    return this.applications.filter(app => app.status === 'pending').length;
  }

  getApprovedCount(): number {
    return this.applications.filter(app => app.status === 'approved').length;
  }

  getRejectedCount(): number {
    return this.applications.filter(app => app.status === 'rejected').length;
  }

  getAverageProcessingTime(): number {
    // Mock pour l'exemple
    return Math.round(Math.random() * 10 + 3);
  }

  getApplicationType(application: CreditApplication): string {
    return application.credit_product?.type || 'unknown';
  }

  getApplicationTypeLabel(application: CreditApplication): string {
    const type = this.getApplicationType(application);
    const labels: { [key: string]: string } = {
      'immobilier': 'Immobilier',
      'consommation': 'Consommation',
      'auto': 'Auto',
      'professionnel': 'Professionnel'
    };
    return labels[type] || type;
  }

  getBankName(application: CreditApplication): string {
    return application.credit_product?.bank?.name || 'N/A';
  }

  getBankLogo(application: CreditApplication): string | null {
    return application.credit_product?.bank?.logo_url || null;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'under_review': 'En examen',
      'approved': 'Approuvé',
      'rejected': 'Refusé',
      'completed': 'Finalisé'
    };
    return labels[status] || status;
  }

  getPriority(application: CreditApplication): string {
    // Logique de calcul de priorité basée sur le montant, délai, etc.
    const amount = application.requested_amount;
    if (amount > 50000000) return 'urgent';
    if (amount > 20000000) return 'high';
    if (amount > 5000000) return 'normal';
    return 'low';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'low': 'Faible',
      'normal': 'Normale',
      'high': 'Élevée',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  }

  getDeadlineClass(application: CreditApplication): string {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(application.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreation > 7) return 'overdue';
    if (daysSinceCreation > 3) return 'warning';
    return 'normal';
  }

  getProcessingTimeText(application: CreditApplication): string {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(application.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreation === 0) return 'Aujourd\'hui';
    if (daysSinceCreation === 1) return '1 jour';
    return `${daysSinceCreation} jours`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.pagination?.total || 0);
  }

  getTotalPages(): number {
    return this.pagination?.pages || 1;
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
      pages.push(i);
    }
    
    return pages;
  }
}