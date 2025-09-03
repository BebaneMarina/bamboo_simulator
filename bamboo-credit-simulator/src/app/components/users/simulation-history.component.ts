// src/app/user/simulation-history.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AuthService, UserSimulation } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-simulation-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="simulation-history-container">
      <div class="container">
        
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>Mes Simulations</h1>
            <p>Retrouvez toutes vos simulations financières</p>
          </div>
          
          <div class="header-actions">
            <select [(ngModel)]="selectedType" (ngModelChange)="applyFilters()" class="filter-select">
              <option value="">Tous les types</option>
              <option value="credit">Crédit</option>
              <option value="savings">Épargne</option>
              <option value="insurance">Assurance</option>
            </select>
            
            <button routerLink="/borrowing-capacity" class="btn-primary">
              Nouvelle simulation
            </button>
          </div>
        </div>

        <!-- Filtres et recherche -->
        <div class="filters-section">
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (ngModelChange)="applyFilters()"
              placeholder="Rechercher une simulation..."
              class="search-input"
            />
          </div>
          
          <div class="filter-buttons">
            <button 
              *ngFor="let status of statusFilters"
              [class.active]="selectedStatus === status.value"
              (click)="setStatusFilter(status.value)"
              class="filter-btn">
              {{ status.label }}
            </button>
          </div>
        </div>

        <!-- Liste des simulations -->
        <div class="simulations-content">
          
          <!-- Loading state -->
          <div *ngIf="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Chargement des simulations...</p>
          </div>

          <!-- Empty state -->
          <div *ngIf="!isLoading && filteredSimulations.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <h2>Aucune simulation trouvée</h2>
            <p *ngIf="searchTerm || selectedType || selectedStatus">Essayez de modifier vos filtres</p>
            <p *ngIf="!searchTerm && !selectedType && !selectedStatus">
              Vous n'avez pas encore créé de simulations
            </p>
            <button routerLink="/borrowing-capacity" class="btn-primary">
              Créer ma première simulation
            </button>
          </div>

          <!-- Simulations grid -->
          <div *ngIf="!isLoading && filteredSimulations.length > 0" class="simulations-grid">
            <div 
              *ngFor="let simulation of filteredSimulations" 
              class="simulation-card"
              [class]="simulation.type"
              (click)="viewSimulation(simulation)">
              
              <div class="card-header">
                <div class="simulation-type">
                  <div class="type-icon" [class]="simulation.type">
                    <span *ngIf="simulation.type === 'credit'">💳</span>
                    <span *ngIf="simulation.type === 'savings'">💰</span>
                    <span *ngIf="simulation.type === 'insurance'">🛡️</span>
                  </div>
                  <div class="type-info">
                    <span class="type-name">{{ getTypeName(simulation.type) }}</span>
                    <span class="simulation-date">{{ formatDate(simulation.created_at) }}</span>
                  </div>
                </div>
                
                <div class="card-menu">
                  <button (click)="toggleMenu(simulation.id, $event)" class="menu-button">⋮</button>
                  <div 
                    *ngIf="showMenu === simulation.id" 
                    class="dropdown-menu"
                    (click)="$event.stopPropagation()">
                    <button (click)="viewSimulation(simulation)" class="menu-item">
                      👁️ Voir les détails
                    </button>
                    <button (click)="duplicateSimulation(simulation)" class="menu-item">
                      📋 Dupliquer
                    </button>
                    <button (click)="createApplicationFromSimulation(simulation)" class="menu-item">
                      📝 Créer une demande
                    </button>
                    <button (click)="downloadSimulation(simulation)" class="menu-item">
                      💾 Télécharger
                    </button>
                    <div class="menu-divider"></div>
                    <button (click)="deleteSimulation(simulation)" class="menu-item delete">
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-content">
                <h3 class="simulation-name">
                  {{ simulation.name || simulation.product_name }}
                </h3>
                
                <div class="simulation-details">
                  <div class="detail-item">
                    <span class="label">Établissement:</span>
                    <span class="value">{{ simulation.bank_or_company_name }}</span>
                  </div>
                  
                  <div *ngIf="simulation.type === 'credit'" class="detail-item">
                    <span class="label">Montant:</span>
                    <span class="value">{{ formatCurrency(simulation.parameters?.['amount']) }}</span>
                  </div>
                  
                  <div *ngIf="simulation.type === 'savings'" class="detail-item">
                    <span class="label">Épargne mensuelle:</span>
                    <span class="value">{{ formatCurrency(simulation.parameters?.['monthly_amount']) }}</span>
                  </div>
                  
                  <div *ngIf="simulation.type === 'insurance'" class="detail-item">
                    <span class="label">Type de couverture:</span>
                    <span class="value">{{ simulation.parameters?.['coverage_type'] }}</span>
                  </div>
                </div>

                <div class="simulation-results">
                  <div *ngIf="simulation.type === 'credit'" class="result-summary">
                    <div class="result-item primary">
                      <span class="result-label">Mensualité</span>
                      <span class="result-value">{{ formatCurrency(simulation.result_summary?.monthly_payment) }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Taux</span>
                      <span class="result-value">{{ formatPercent(simulation.result_summary?.interest_rate) }}</span>
                    </div>
                  </div>
                  
                  <div *ngIf="simulation.type === 'savings'" class="result-summary">
                    <div class="result-item primary">
                      <span class="result-label">Montant final</span>
                      <span class="result-value">{{ formatCurrency(simulation.result_summary?.final_amount) }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Rendement</span>
                      <span class="result-value">{{ formatPercent(simulation.result_summary?.annual_return) }}</span>
                    </div>
                  </div>
                  
                  <div *ngIf="simulation.type === 'insurance'" class="result-summary">
                    <div class="result-item primary">
                      <span class="result-label">Prime mensuelle</span>
                      <span class="result-value">{{ formatCurrency(simulation.result_summary?.monthly_premium) }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Couverture</span>
                      <span class="result-value">{{ formatCurrency(simulation.result_summary?.coverage_amount) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="simulation-status">
                  <span class="status-badge" [class]="simulation.status">
                    {{ getStatusLabel(simulation.status) }}
                  </span>
                </div>
                
                <div class="card-actions">
                  <button (click)="viewSimulation(simulation, $event)" class="action-btn primary">
                    Voir détails
                  </button>
                  <button (click)="createApplicationFromSimulation(simulation, $event)" class="action-btn">
                    Faire une demande
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="pagination">
            <button 
              [disabled]="currentPage === 1" 
              (click)="goToPage(currentPage - 1)"
              class="page-btn">
              Précédent
            </button>
            
            <div class="page-numbers">
              <button 
                *ngFor="let page of getPageNumbers()"
                [class.active]="page === currentPage"
                (click)="goToPage(page)"
                class="page-number">
                {{ page }}
              </button>
            </div>
            
            <button 
              [disabled]="currentPage === totalPages" 
              (click)="goToPage(currentPage + 1)"
              class="page-btn">
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay pour fermer les menus -->
    <div *ngIf="showMenu" class="overlay" (click)="showMenu = null"></div>
  `,
  styles: [`
    .simulation-history-container {
      padding: 20px;
      min-height: 100vh;
      background-color: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .header-content h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2rem;
    }
    
    .header-content p {
      margin: 5px 0 0 0;
      color: #7f8c8d;
    }
    
    .header-actions {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    
    .filter-select {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }
    
    .btn-primary {
      background: #3498db;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }
    
    .btn-primary:hover {
      background: #2980b9;
    }
    
    .filters-section {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .search-box {
      margin-bottom: 20px;
    }
    
    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }
    
    .filter-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .filter-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .filter-btn.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }
    
    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }
    
    .loading-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }
    
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }
    
    .empty-state h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .empty-state p {
      color: #7f8c8d;
      margin-bottom: 20px;
    }
    
    .simulations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .simulation-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid #3498db;
    }
    
    .simulation-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .simulation-card.credit {
      border-left-color: #e74c3c;
    }
    
    .simulation-card.savings {
      border-left-color: #27ae60;
    }
    
    .simulation-card.insurance {
      border-left-color: #f39c12;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .simulation-type {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .type-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    
    .type-icon.credit { background: #ffeaea; }
    .type-icon.savings { background: #e8f5e8; }
    .type-icon.insurance { background: #fff8e1; }
    
    .type-name {
      display: block;
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }
    
    .simulation-date {
      display: block;
      font-size: 12px;
      color: #7f8c8d;
    }
    
    .card-menu {
      position: relative;
    }
    
    .menu-button {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
    }
    
    .menu-button:hover {
      background: #f8f9fa;
    }
    
    .dropdown-menu {
      position: absolute;
      right: 0;
      top: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 200px;
    }
    
    .menu-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 12px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
    }
    
    .menu-item:hover {
      background: #f8f9fa;
    }
    
    .menu-item.delete {
      color: #e74c3c;
    }
    
    .menu-divider {
      height: 1px;
      background: #eee;
      margin: 5px 0;
    }
    
    .simulation-name {
      margin: 0 0 15px 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    
    .simulation-details {
      margin-bottom: 15px;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .label {
      color: #7f8c8d;
      font-weight: 500;
    }
    
    .value {
      color: #2c3e50;
      font-weight: 600;
    }
    
    .simulation-results {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .result-summary {
      display: flex;
      justify-content: space-between;
    }
    
    .result-item {
      text-align: center;
    }
    
    .result-item.primary {
      flex: 2;
    }
    
    .result-label {
      display: block;
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 5px;
    }
    
    .result-value {
      display: block;
      font-weight: 700;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status-badge.completed {
      background: #e8f5e8;
      color: #27ae60;
    }
    
    .status-badge.saved {
      background: #fff8e1;
      color: #f39c12;
    }
    
    .status-badge.shared {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .card-actions {
      display: flex;
      gap: 10px;
    }
    
    .action-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }
    
    .action-btn.primary {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }
    
    .action-btn:hover {
      background: #f8f9fa;
    }
    
    .action-btn.primary:hover {
      background: #2980b9;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-top: 30px;
    }
    
    .page-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-numbers {
      display: flex;
      gap: 5px;
    }
    
    .page-number {
      padding: 8px 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      min-width: 40px;
    }
    
    .page-number.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }
  `]
})
export class SimulationHistoryComponent implements OnInit, OnDestroy {
  simulations: UserSimulation[] = [];
  filteredSimulations: UserSimulation[] = [];
  
  isLoading = true;
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  showMenu: string | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  statusFilters = [
    { value: '', label: 'Tous' },
    { value: 'completed', label: 'Terminées' },
    { value: 'saved', label: 'Sauvegardées' },
    { value: 'shared', label: 'Partagées' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Configuration de la recherche avec debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadSimulations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSimulations(): void {
    this.isLoading = true;
    
    this.authService.getUserSimulations().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (simulations) => {
        this.simulations = simulations;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des simulations:', error);
        this.notificationService.showError('Erreur lors du chargement des simulations');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.simulations];

    // Filtre par recherche
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sim => 
        sim.name?.toLowerCase().includes(search) ||
        sim.product_name?.toLowerCase().includes(search) ||
        sim.bank_or_company_name?.toLowerCase().includes(search)
      );
    }

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(sim => sim.type === this.selectedType);
    }

    // Filtre par statut
    if (this.selectedStatus) {
      filtered = filtered.filter(sim => sim.status === this.selectedStatus);
    }

    // Tri par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    this.filteredSimulations = filtered;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSimulations.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  toggleMenu(simulationId: string, event: Event): void {
    event.stopPropagation();
    this.showMenu = this.showMenu === simulationId ? null : simulationId;
  }

  viewSimulation(simulation: UserSimulation, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/simulations', simulation.type, simulation.id]);
  }

  duplicateSimulation(simulation: UserSimulation): void {
    this.showMenu = null;
    
    // Rediriger vers le simulateur approprié avec les paramètres pré-remplis
    const routeMap = {
      'credit': '/borrowing-capacity',
      'savings': '/savings-simulator',
      'insurance': '/insurance-comparator'
    };

    const route = routeMap[simulation.type as keyof typeof routeMap];
    if (route) {
      this.router.navigate([route], { 
        queryParams: { 
          duplicate: simulation.id,
          ...simulation.parameters 
        }
      });
    }
  }

  createApplicationFromSimulation(simulation: UserSimulation, event?: Event): void {
    if (event) event.stopPropagation();
    this.showMenu = null;
    
    this.router.navigate(['/apply', simulation.type], {
      queryParams: {
        simulation_id: simulation.id,
        product_name: simulation.product_name,
        bank_name: simulation.bank_or_company_name
      }
    });
  }

  downloadSimulation(simulation: UserSimulation): void {
    this.showMenu = null;
    
    this.authService.downloadSimulation(simulation.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `simulation-${simulation.type}-${simulation.id}.pdf`;
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

  deleteSimulation(simulation: UserSimulation): void {
    this.showMenu = null;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la simulation "${simulation.name || simulation.product_name}" ?`)) {
      this.authService.deleteSimulation(simulation.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.simulations = this.simulations.filter(s => s.id !== simulation.id);
          this.applyFilters();
          this.notificationService.showSuccess('Simulation supprimée');
        },
        error: (error: any) => {
          this.notificationService.showError('Erreur lors de la suppression');
        }
      });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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

  formatPercent(rate: number | undefined): string {
    if (!rate) return '-';
    return `${rate.toFixed(1)}%`;
  }
}