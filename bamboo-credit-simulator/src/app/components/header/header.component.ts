// src/app/shared/components/header/header.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, User } from '../../services/user-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <nav class="nav-container">
        <div class="nav-brand">
          <a routerLink="/simulator-home" class="brand-link">
            <span class="brand-text">SimBot Gab</span>
          </a>
        </div>

        <div class="nav-menu">
          <a routerLink="/simulator-home" routerLinkActive="active" class="nav-link">Accueil</a>
          <a routerLink="/multi-bank-comparator" routerLinkActive="active" class="nav-link">Comparateur</a>
          <a routerLink="/tracking" routerLinkActive="active" class="nav-link">Suivi</a>
          
          <!-- Menu utilisateur non connecté -->
          <div *ngIf="!isAuthenticated" class="auth-menu">
            <a routerLink="/auth/login" class="nav-link auth-link">Se connecter</a>
            <a routerLink="/auth/login" [queryParams]="{tab: 'register'}" class="btn-register">S'inscrire</a>
          </div>

          <!-- Menu utilisateur connecté -->
          <div *ngIf="isAuthenticated" class="user-menu">
            <div class="user-dropdown" [class.show]="showUserMenu">
              <button class="user-toggle" (click)="toggleUserMenu()">
                <div class="user-avatar">{{ getUserInitials() }}</div>
                <span class="user-name">{{ getFirstName() }}</span>
                <svg class="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              <div class="dropdown-menu" [class.show]="showUserMenu">
                <a routerLink="/dashboard" (click)="closeUserMenu()" class="dropdown-item">
                  <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z"></path>
                  </svg>
                  Mon Espace
                </a>
                
                <a routerLink="/simulations" (click)="closeUserMenu()" class="dropdown-item">
                  <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Mes Simulations
                </a>
                
                <a routerLink="/applications" (click)="closeUserMenu()" class="dropdown-item">
                  <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Mes Demandes
                </a>
                
                <div class="dropdown-divider"></div>
                
                <a routerLink="/profile" (click)="closeUserMenu()" class="dropdown-item">
                  <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Mon Profil
                </a>
                
                <button (click)="logout()" class="dropdown-item logout">
                  <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu mobile -->
        <button class="mobile-menu-toggle" (click)="toggleMobileMenu()">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </nav>

      <!-- Menu mobile overlay -->
      <div *ngIf="showMobileMenu" class="mobile-menu-overlay" (click)="closeMobileMenu()">
        <div class="mobile-menu">
          <div class="mobile-menu-header">
            <span class="brand-text">SimBot Gab</span>
            <button (click)="closeMobileMenu()" class="close-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mobile-menu-content">
            <a routerLink="/simulator-home" (click)="closeMobileMenu()" class="mobile-nav-link">Accueil</a>
            <a routerLink="/multi-bank-comparator" (click)="closeMobileMenu()" class="mobile-nav-link">Comparateur</a>
            <a routerLink="/tracking" (click)="closeMobileMenu()" class="mobile-nav-link">Suivi</a>

            <div *ngIf="!isAuthenticated" class="mobile-auth-section">
              <a routerLink="/auth/login" (click)="closeMobileMenu()" class="mobile-nav-link">Se connecter</a>
              <a routerLink="/auth/login" [queryParams]="{tab: 'register'}" (click)="closeMobileMenu()" class="mobile-register-btn">S'inscrire</a>
            </div>

            <div *ngIf="isAuthenticated" class="mobile-user-section">
              <div class="mobile-user-info">
                <div class="user-avatar">{{ getUserInitials() }}</div>
                <span class="user-name">{{ getFullName() }}</span>
              </div>
              
              <a routerLink="/dashboard" (click)="closeMobileMenu()" class="mobile-nav-link">Mon Espace</a>
              <a routerLink="/simulations" (click)="closeMobileMenu()" class="mobile-nav-link">Mes Simulations</a>
              <a routerLink="/applications" (click)="closeMobileMenu()" class="mobile-nav-link">Mes Demandes</a>
              <a routerLink="/profile" (click)="closeMobileMenu()" class="mobile-nav-link">Mon Profil</a>
              
              <button (click)="logout(); closeMobileMenu()" class="mobile-nav-link logout">Se déconnecter</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Overlay pour fermer les menus -->
      <div *ngIf="showUserMenu || showMobileMenu" class="overlay" (click)="closeAllMenus()"></div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 70px;
    }

    .brand-link {
      text-decoration: none;
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a4d3a;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-link {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      transition: color 0.3s ease;
    }

    .nav-link:hover,
    .nav-link.active {
      color: #1a4d3a;
    }

    .auth-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .auth-link {
      color: #1a4d3a;
      font-weight: 600;
    }

    .btn-register {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5e4f 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-register:hover {
      background: linear-gradient(135deg, #2d5e4f 0%, #1a4d3a 100%);
      transform: translateY(-1px);
    }

    .user-menu {
      position: relative;
    }

    .user-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background 0.2s ease;
    }

    .user-toggle:hover {
      background: #f3f4f6;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5e4f 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-name {
      color: #374151;
      font-weight: 500;
    }

    .dropdown-arrow {
      width: 1rem;
      height: 1rem;
      color: #6b7280;
      transition: transform 0.2s ease;
    }

    .user-dropdown.show .dropdown-arrow {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      min-width: 200px;
      z-index: 50;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
    }

    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #374151;
      text-decoration: none;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item.logout {
      color: #dc2626;
    }

    .dropdown-item.logout:hover {
      background: #fef2f2;
    }

    .dropdown-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.5rem 0;
    }

    .mobile-menu-toggle {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
    }

    .mobile-menu-toggle svg {
      width: 1.5rem;
      height: 1.5rem;
      color: #374151;
    }

    .mobile-menu-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1001;
      display: none;
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100vh;
      background: white;
      display: flex;
      flex-direction: column;
    }

    .mobile-menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
    }

    .close-button svg {
      width: 1.5rem;
      height: 1.5rem;
      color: #6b7280;
    }

    .mobile-menu-content {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .mobile-nav-link {
      padding: 0.75rem;
      color: #374151;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: background 0.2s ease;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      width: 100%;
    }

    .mobile-nav-link:hover {
      background: #f3f4f6;
    }

    .mobile-nav-link.logout {
      color: #dc2626;
    }

    .mobile-auth-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .mobile-register-btn {
      background: linear-gradient(135deg, #1a4d3a 0%, #2d5e4f 100%);
      color: white;
      padding: 0.75rem;
      border-radius: 0.5rem;
      text-decoration: none;
      text-align: center;
      font-weight: 600;
    }

    .mobile-user-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .mobile-user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
    }

    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }

      .mobile-menu-toggle {
        display: block;
      }

      .mobile-menu-overlay {
        display: block;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAuthenticated = false;
  showUserMenu = false;
  showMobileMenu = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user: User | null) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      },
      error: () => {
        this.currentUser = null;
        this.isAuthenticated = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showMobileMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    this.showUserMenu = false;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  closeAllMenus(): void {
    this.showUserMenu = false;
    this.showMobileMenu = false;
  }

  logout(): void {
    this.authService.logout().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.router.navigate(['/simulator-home']);
      },
      error: (error: any) => {
        console.error('Erreur lors de la déconnexion:', error);
        // Forcer la redirection même en cas d'erreur
        this.router.navigate(['/simulator-home']);
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstInitial = this.currentUser.first_name?.charAt(0).toUpperCase() || '';
    const lastInitial = this.currentUser.last_name?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}` || 'U';
  }

  getFirstName(): string {
    return this.currentUser?.first_name || 'Utilisateur';
  }

  getFullName(): string {
    if (!this.currentUser) return 'Utilisateur';
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
  }
}