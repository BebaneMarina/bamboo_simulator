// src/app/admin/layout/admin-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.services';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="admin-sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="logo">
            <i class="fas fa-cog"></i>
            <span *ngIf="!sidebarCollapsed">Admin Panel</span>
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <i class="fas" [class.fa-chevron-left]="!sidebarCollapsed" [class.fa-chevron-right]="sidebarCollapsed"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- Dashboard -->
          <a routerLink="/admin/dashboard" 
             routerLinkActive="active" 
             class="nav-item">
            <i class="fas fa-tachometer-alt"></i>
            <span *ngIf="!sidebarCollapsed">Tableau de Bord</span>
          </a>

          <!-- Gestion des administrateurs -->
          <div class="nav-section" *ngIf="canManageAdmins">
            <div class="nav-section-title" *ngIf="!sidebarCollapsed" (click)="toggleAdminSection()">
              <i class="fas fa-users-cog"></i>
              <span>Administrateurs</span>
              <i class="fas fa-chevron-down toggle-icon" [class.rotated]="adminSectionExpanded"></i>
            </div>
            
            <!-- Section titre pour sidebar collapsée -->
            <div class="nav-section-title collapsed-title" *ngIf="sidebarCollapsed">
              <i class="fas fa-users-cog" title="Administrateurs"></i>
            </div>
            
            <div class="nav-subsection" [class.expanded]="adminSectionExpanded || sidebarCollapsed">
              <a routerLink="/admin/management" 
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: true}"
                 class="nav-item sub-item"
                 [title]="listAdminsTitle">
                <i class="fas fa-users"></i>
                <span *ngIf="!sidebarCollapsed">Liste des admins</span>
              </a>
              
              <a routerLink="/admin/management/create" 
                 routerLinkActive="active"
                 class="nav-item sub-item"
                 [title]="createAdminTitle">
                <i class="fas fa-user-plus"></i>
                <span *ngIf="!sidebarCollapsed">Créer un admin</span>
              </a>
            </div>
          </div>

          <!-- Gestion des banques -->
          <div class="nav-section" *ngIf="canManageBanks">
            <div class="nav-section-title" *ngIf="!sidebarCollapsed" (click)="toggleBankSection()">
              <i class="fas fa-university"></i>
              <span>Banques</span>
              <i class="fas fa-chevron-down toggle-icon" [class.rotated]="bankSectionExpanded"></i>
            </div>
            
            <div class="nav-section-title collapsed-title" *ngIf="sidebarCollapsed">
              <i class="fas fa-university" title="Banques"></i>
            </div>
            
            <div class="nav-subsection" [class.expanded]="bankSectionExpanded || sidebarCollapsed">
              <a routerLink="/admin/banks" 
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: true}"
                 class="nav-item sub-item"
                 [title]="listBanksTitle">
                <i class="fas fa-list"></i>
                <span *ngIf="!sidebarCollapsed">Liste des banques</span>
              </a>
              
              <a routerLink="/admin/banks/create" 
                 routerLinkActive="active"
                 class="nav-item sub-item"
                 [title]="addBankTitle">
                <i class="fas fa-plus"></i>
                <span *ngIf="!sidebarCollapsed">Ajouter une banque</span>
              </a>
            </div>
          </div>

          <!-- Gestion des produits -->
          <div class="nav-section" *ngIf="canManageProducts">
            <div class="nav-section-title" *ngIf="!sidebarCollapsed" (click)="toggleProductSection()">
              <i class="fas fa-coins"></i>
              <span>Produits</span>
              <i class="fas fa-chevron-down toggle-icon" [class.rotated]="productSectionExpanded"></i>
            </div>
            
            <div class="nav-section-title collapsed-title" *ngIf="sidebarCollapsed">
              <i class="fas fa-coins" title="Produits"></i>
            </div>
            
            <div class="nav-subsection" [class.expanded]="productSectionExpanded || sidebarCollapsed">
              <a routerLink="/admin/credit-products" 
                 routerLinkActive="active"
                 class="nav-item sub-item"
                 [title]="sidebarCollapsed ? 'Produits de crédit' : ''">
                <i class="fas fa-credit-card"></i>
                <span *ngIf="!sidebarCollapsed">Produits de crédit</span>
              </a>
              
              <a routerLink="/admin/savings-products" 
                 routerLinkActive="active"
                 class="nav-item sub-item"
                 [title]="sidebarCollapsed ? 'Produits d\\'épargne' : ''">
                <i class="fas fa-piggy-bank"></i>
                <span *ngIf="!sidebarCollapsed">Produits d'épargne</span>
              </a>
              
              <a routerLink="/admin/insurance-products" 
                 routerLinkActive="active"
                 class="nav-item sub-item"
                 [title]="sidebarCollapsed ? 'Produits d\\'assurance' : ''">
                <i class="fas fa-shield-alt"></i>
                <span *ngIf="!sidebarCollapsed">Produits d'assurance</span>
              </a>
            </div>
          </div>

          <!-- Simulations -->
          <a routerLink="/admin/simulations" 
             routerLinkActive="active"
             class="nav-item"
             *ngIf="canViewSimulations">
            <i class="fas fa-calculator"></i>
            <span *ngIf="!sidebarCollapsed">Simulations</span>
          </a>

          <!-- Demandes clients -->
          <a routerLink="/admin/applications" 
             routerLinkActive="active"
             class="nav-item"
             *ngIf="canViewApplications">
            <i class="fas fa-file-alt"></i>
            <span *ngIf="!sidebarCollapsed">Demandes clients</span>
          </a>

          <!-- Audit -->
          <a routerLink="/admin/audit" 
             routerLinkActive="active"
             class="nav-item"
             *ngIf="canViewAudit">
            <i class="fas fa-history"></i>
            <span *ngIf="!sidebarCollapsed">Audit & Logs</span>
          </a>

          <!-- Paramètres -->
          <a routerLink="/admin/settings" 
             routerLinkActive="active"
             class="nav-item"
             *ngIf="canManageSettings">
            <i class="fas fa-cog"></i>
            <span *ngIf="!sidebarCollapsed">Paramètres</span>
          </a>
        </nav>

        <!-- User info at bottom -->
        <div class="sidebar-footer" *ngIf="!sidebarCollapsed">
          <div class="user-info">
            <div class="user-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="user-details">
              <div class="user-name">{{ adminAuth.getUserDisplayName() }}</div>
              <div class="user-role">{{ adminAuth.getRoleLabel() }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="admin-main" [class.sidebar-collapsed]="sidebarCollapsed">
        <!-- Header -->
        <header class="admin-header">
          <div class="header-left">
            <button class="menu-toggle" (click)="toggleSidebar()">
              <i class="fas fa-bars"></i>
            </button>
            <div class="breadcrumb">
              <ng-container *ngFor="let crumb of breadcrumbs; let last = last">
                <span class="breadcrumb-item" [class.active]="last">{{ crumb }}</span>
                <i class="fas fa-chevron-right" *ngIf="!last"></i>
              </ng-container>
            </div>
          </div>

          <div class="header-right">
            <div class="header-actions">
              <!-- Notifications -->
              <button class="action-btn" title="Notifications">
                <i class="fas fa-bell"></i>
                <span class="badge" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
              </button>

              <!-- User menu -->
              <div class="user-menu" (click)="toggleUserMenu()" [class.open]="userMenuOpen">
                <div class="user-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <span class="user-name">{{ adminAuth.getUserDisplayName() }}</span>
                <i class="fas fa-chevron-down"></i>

                <div class="user-dropdown" *ngIf="userMenuOpen">
                  <a href="#" class="dropdown-item">
                    <i class="fas fa-user"></i>
                    Mon profil
                  </a>
                  <a href="#" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    Paramètres
                  </a>
                  <div class="dropdown-divider"></div>
                  <a href="#" class="dropdown-item" (click)="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    Déconnexion
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Content area -->
        <main class="admin-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userMenuOpen = false;
  notificationCount = 3;
  breadcrumbs: string[] = [];
  
  // Variables pour l'expansion des sections
  adminSectionExpanded = false;
  bankSectionExpanded = false;
  productSectionExpanded = false;

  // Titres pour les tooltips
  get createAdminTitle(): string {
    return this.sidebarCollapsed ? 'Créer un admin' : '';
  }

  get listAdminsTitle(): string {
    return this.sidebarCollapsed ? 'Liste des admins' : '';
  }

  get listBanksTitle(): string {
    return this.sidebarCollapsed ? 'Liste des banques' : '';
  }

  get addBankTitle(): string {
    return this.sidebarCollapsed ? 'Ajouter une banque' : '';
  }

  get creditProductsTitle(): string {
    return this.sidebarCollapsed ? 'Produits de crédit' : '';
  }

  get savingsProductsTitle(): string {
    return this.sidebarCollapsed ? 'Produits d\'épargne' : '';
  }

  get insuranceProductsTitle(): string {
    return this.sidebarCollapsed ? 'Produits d\'assurance' : '';
  }

  constructor(
    public adminAuth: AdminAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écouter les changements de route pour mettre à jour le breadcrumb
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateBreadcrumbs(event.url);
        this.updateSectionExpansion(event.url);
      });

    // Initialiser avec la route actuelle
    this.updateBreadcrumbs(this.router.url);
    this.updateSectionExpansion(this.router.url);
  }

  // Permissions getters - Ajout de vérifications plus robustes
  get canManageAdmins(): boolean {
    return this.adminAuth.hasPermission('users', 'read') || 
           this.adminAuth.hasPermission('admin_management', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  get canManageBanks(): boolean {
    return this.adminAuth.hasPermission('banks', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  get canManageProducts(): boolean {
    return this.adminAuth.hasPermission('credit_products', 'read') ||
           this.adminAuth.hasPermission('savings_products', 'read') ||
           this.adminAuth.hasPermission('insurance_products', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  get canViewSimulations(): boolean {
    return this.adminAuth.hasPermission('simulations', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  get canViewApplications(): boolean {
    return this.adminAuth.hasPermission('applications', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  get canViewAudit(): boolean {
    return this.adminAuth.hasPermission('audit', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  get canManageSettings(): boolean {
    return this.adminAuth.hasPermission('system_settings', 'read') ||
           this.adminAuth.currentUser?.role === 'super_admin';
  }

  // Méthodes pour toggle les sections
  toggleAdminSection(): void {
    this.adminSectionExpanded = !this.adminSectionExpanded;
  }

  toggleBankSection(): void {
    this.bankSectionExpanded = !this.bankSectionExpanded;
  }

  toggleProductSection(): void {
    this.productSectionExpanded = !this.productSectionExpanded;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  updateBreadcrumbs(url: string): void {
    if (url.includes('/dashboard')) {
      this.breadcrumbs = ['Admin', 'Tableau de Bord'];
    } else if (url.includes('/management/create')) {
      this.breadcrumbs = ['Admin', 'Administrateurs', 'Créer'];
    } else if (url.includes('/management/edit')) {
      this.breadcrumbs = ['Admin', 'Administrateurs', 'Modifier'];
    } else if (url.includes('/management')) {
      this.breadcrumbs = ['Admin', 'Administrateurs'];
    } else if (url.includes('/banks/create')) {
      this.breadcrumbs = ['Admin', 'Banques', 'Créer'];
    } else if (url.includes('/banks/edit')) {
      this.breadcrumbs = ['Admin', 'Banques', 'Modifier'];
    } else if (url.includes('/banks')) {
      this.breadcrumbs = ['Admin', 'Banques'];
    } else if (url.includes('/credit-products')) {
      this.breadcrumbs = ['Admin', 'Produits', 'Crédits'];
    } else if (url.includes('/savings-products')) {
      this.breadcrumbs = ['Admin', 'Produits', 'Épargne'];
    } else if (url.includes('/insurance-products')) {
      this.breadcrumbs = ['Admin', 'Produits', 'Assurance'];
    } else if (url.includes('/simulations')) {
      this.breadcrumbs = ['Admin', 'Simulations'];
    } else if (url.includes('/applications')) {
      this.breadcrumbs = ['Admin', 'Demandes'];
    } else if (url.includes('/audit')) {
      this.breadcrumbs = ['Admin', 'Audit'];
    } else if (url.includes('/settings')) {
      this.breadcrumbs = ['Admin', 'Paramètres'];
    } else {
      this.breadcrumbs = ['Admin'];
    }
  }

  updateSectionExpansion(url: string): void {
    // Expand sections based on current route
    this.adminSectionExpanded = url.includes('/management');
    this.bankSectionExpanded = url.includes('/banks');
    this.productSectionExpanded = url.includes('/credit-products') || 
                                 url.includes('/savings-products') || 
                                 url.includes('/insurance-products');
  }

  logout(): void {
    this.adminAuth.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}