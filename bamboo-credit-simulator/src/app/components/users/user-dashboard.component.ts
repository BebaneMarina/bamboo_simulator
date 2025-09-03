import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, User, UserDashboard, UserSimulation, UserApplication, UserNotification } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
  <!-- Header -->
  <header class="dashboard-header">
    <div class="container">
      <div class="header-content">
        <div class="user-welcome">
          <h1>Bonjour {{ getFirstName() }} !</h1>
          <p>Voici un aperçu de votre activité financière</p>
        </div>
        
        <div class="header-actions">
          <button class="notification-button" (click)="toggleNotifications()">
            <span class="icon">🔔</span>
            <span *ngIf="(dashboard?.stats?.unread_notifications || 0) > 0" 
                  class="notification-badge">
              {{ dashboard?.stats?.unread_notifications || 0 }}
            </span>
          </button>
          
          <div class="user-menu">
            <button class="user-avatar" (click)="toggleUserMenu()">
              {{ getUserInitials() }}
            </button>
            
            <div class="user-dropdown" [class.show]="showUserMenu">
              <a routerLink="/profile" (click)="showUserMenu = false">Mon profil</a>
              <a routerLink="/settings" (click)="showUserMenu = false">Paramètres</a>
              <button (click)="logout()" class="logout-btn">Se déconnecter</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="dashboard-main">
    <div class="container">
      
      <!-- Statistiques -->
      <section class="stats-section">
        <h2>Vos activités</h2>
        <div class="stats-grid" *ngIf="dashboard?.stats">
          
          <div class="stat-card">
            <div class="stat-icon credit">💳</div>
            <div class="stat-content">
              <div class="stat-number">{{ dashboard?.stats?.total_credit_simulations || 0 }}</div>
              <div class="stat-label">Simulations crédit</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon savings">💰</div>
            <div class="stat-content">
              <div class="stat-number">{{ dashboard?.stats?.total_savings_simulations || 0 }}</div>
              <div class="stat-label">Simulations épargne</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon insurance">🛡️</div>
            <div class="stat-content">
              <div class="stat-number">{{ dashboard?.stats?.total_insurance_quotes || 0 }}</div>
              <div class="stat-label">Devis assurance</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon applications">📋</div>
            <div class="stat-content">
              <div class="stat-number">{{ getTotalApplications() }}</div>
              <div class="stat-label">Demandes soumises</div>
            </div>
          </div>
          
        </div>
      </section>

      <!-- Actions rapides -->
      <section class="quick-actions-section">
        <h2>Actions rapides</h2>
        <div class="quick-actions-grid">
          
          <button class="action-card" routerLink="/borrowing-capacity">
            <div class="action-icon">🏠</div>
            <div class="action-content">
              <h3>Simuler un crédit</h3>
              <p>Calculez votre capacité d'emprunt</p>
            </div>
          </button>
          
          <button class="action-card" routerLink="/savings-simulator">
            <div class="action-icon">📈</div>
            <div class="action-content">
              <h3>Simuler une épargne</h3>
              <p>Planifiez votre épargne future</p>
            </div>
          </button>
          
          <button class="action-card" routerLink="/insurance-comparator">
            <div class="action-icon">🔐</div>
            <div class="action-content">
              <h3>Comparer assurances</h3>
              <p>Trouvez la meilleure couverture</p>
            </div>
          </button>
          
          <button class="action-card" routerLink="/multi-bank-comparator">
            <div class="action-icon">🏦</div>
            <div class="action-content">
              <h3>Comparer les banques</h3>
              <p>Trouvez les meilleures offres</p>
            </div>
          </button>
          
        </div>
      </section>

      <!-- Contenu principal en 2 colonnes -->
      <div class="dashboard-content">
        
        <!-- Colonne gauche -->
        <div class="left-column">
          
          <!-- Simulations récentes -->
          <section class="dashboard-card">
            <div class="card-header">
              <h3>Simulations récentes</h3>
              <a routerLink="/simulations" class="view-all-link">Voir tout</a>
            </div>
            
            <div class="card-content">
              <div *ngIf="!dashboard?.recent_simulations?.length" class="empty-state">
                <div class="empty-icon">📊</div>
                <p>Aucune simulation sauvegardée</p>
                <button routerLink="/borrowing-capacity" class="btn-primary">
                  Créer une simulation
                </button>
              </div>
              
              <div *ngFor="let simulation of dashboard?.recent_simulations || []" 
                   class="simulation-item">
                
                <div class="simulation-icon" [class]="simulation.type">
                  <span *ngIf="simulation.type === 'credit'">💳</span>
                  <span *ngIf="simulation.type === 'savings'">💰</span>
                  <span *ngIf="simulation.type === 'insurance'">🛡️</span>
                </div>
                
                <div class="simulation-content">
                  <h4>{{ simulation.name || simulation.product_name }}</h4>
                  <p class="bank-name">{{ simulation.bank_or_company_name }}</p>
                  
                  <div class="simulation-results">
                    <span *ngIf="simulation.type === 'credit'" class="result-item">
                      {{ formatCurrency(simulation.result_summary?.monthly_payment) }}/mois
                    </span>
                    <span *ngIf="simulation.type === 'savings'" class="result-item">
                      {{ formatCurrency(simulation.result_summary?.final_amount) }} final
                    </span>
                    <span *ngIf="simulation.type === 'insurance'" class="result-item">
                      {{ formatCurrency(simulation.result_summary?.monthly_premium) }}/mois
                    </span>
                  </div>
                  
                  <div class="simulation-meta">
                    <span class="simulation-date">{{ formatDate(simulation.created_at) }}</span>
                  </div>
                </div>
                
                <div class="simulation-actions">
                  <button class="action-btn" (click)="viewSimulation(simulation)">
                    Voir
                  </button>
                  <button class="action-btn" (click)="createApplication(simulation)">
                    Demander
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Demandes en cours -->
          <section class="dashboard-card">
            <div class="card-header">
              <h3>Demandes en cours</h3>
              <a routerLink="/applications" class="view-all-link">Voir tout</a>
            </div>
            
            <div class="card-content">
              <div *ngIf="!dashboard?.recent_applications?.length" class="empty-state">
                <div class="empty-icon">📄</div>
                <p>Aucune demande en cours</p>
              </div>
              
              <div *ngFor="let application of dashboard?.recent_applications || []" 
                   class="application-item">
                
                <div class="application-icon" [class]="application.type">
                  <span *ngIf="application.type === 'credit'">💳</span>
                  <span *ngIf="application.type === 'savings'">💰</span>
                  <span *ngIf="application.type === 'insurance'">🛡️</span>
                  <span *ngIf="!['credit', 'savings', 'insurance'].includes(application.type)">📋</span>
                </div>
                
                <div class="application-content">
                  <h4>{{ application.product_name }}</h4>
                  <p class="bank-name">{{ application.bank_or_company_name }}</p>
                  
                  <div class="application-details">
                    <span class="amount">{{ formatCurrency(application.amount) }}</span>
                    <span class="status" [class]="application.status">
                      {{ getStatusLabel(application.status) }}
                    </span>
                  </div>
                  
                  <div class="application-meta">
                    <span class="application-date">{{ formatDate(application.submitted_at) }}</span>
                  </div>
                </div>
                
                <div class="application-actions">
                  <button class="action-btn" (click)="viewApplication(application)">
                    Détails
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Colonne droite -->
        <div class="right-column">
          
          <!-- Notifications -->
          <section class="dashboard-card notifications-card">
            <div class="card-header">
              <h3>Notifications récentes</h3>
              <button (click)="markAllNotificationsRead()" 
                      *ngIf="(dashboard?.stats?.unread_notifications || 0) > 0"
                      class="mark-read-btn">
                Tout marquer lu
              </button>
            </div>
            
            <div class="card-content notifications-content">
              <div *ngIf="!dashboard?.notifications?.length" class="empty-state">
                <div class="empty-icon">🔔</div>
                <p>Aucune notification</p>
              </div>
              
              <div *ngFor="let notification of dashboard?.notifications || []" 
                   class="notification-item"
                   [class.unread]="!notification.is_read"
                   (click)="markNotificationRead(notification)">
                
                <div class="notification-icon" [class]="notification.priority">
                  <span *ngIf="notification.type === 'welcome'">👋</span>
                  <span *ngIf="notification.type === 'application_submitted'">📋</span>
                  <span *ngIf="notification.type === 'application_approved'">✅</span>
                  <span *ngIf="notification.type === 'application_rejected'">❌</span>
                  <span *ngIf="notification.type === 'security'">🔒</span>
                  <span *ngIf="!['welcome', 'application_submitted', 'application_approved', 'application_rejected', 'security'].includes(notification.type)">💬</span>
                </div>
                
                <div class="notification-content">
                  <h4>{{ notification.title }}</h4>
                  <p>{{ notification.message }}</p>
                  <span class="notification-time">{{ formatDate(notification.created_at) }}</span>
                </div>
                
                <div class="notification-status">
                  <div *ngIf="!notification.is_read" class="unread-dot"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Conseils personnalisés -->
          <section class="dashboard-card tips-card">
            <div class="card-header">
              <h3>Conseils pour vous</h3>
            </div>
            
            <div class="card-content">
              <div class="tip-item">
                <div class="tip-icon">💡</div>
                <div class="tip-content">
                  <h4>Diversifiez vos placements</h4>
                  <p>Répartissez vos investissements entre plusieurs produits pour réduire les risques.</p>
                </div>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">📈</div>
                <div class="tip-content">
                  <h4>Épargnez régulièrement</h4>
                  <p>Même de petits montants épargnés régulièrement peuvent avoir un impact important sur le long terme.</p>
                </div>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">🔍</div>
                <div class="tip-content">
                  <h4>Comparez avant de choisir</h4>
                  <p>Utilisez nos comparateurs pour trouver les meilleures offres du marché.</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

    </div>
  </main>

  <!-- Panel de notifications -->
  <div class="notifications-panel" [class.show]="showNotifications">
    <div class="panel-header">
      <h3>Notifications</h3>
      <button class="close-btn" (click)="showNotifications = false">✕</button>
    </div>
    
    <div class="panel-content">
      <div *ngIf="allNotifications.length === 0" class="empty-state">
        <p>Aucune notification</p>
      </div>
      
      <div *ngFor="let notification of allNotifications" 
           class="notification-item"
           [class.unread]="!notification.is_read">
        
        <div class="notification-content">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
          <span class="notification-time">{{ formatDate(notification.created_at) }}</span>
        </div>
        
        <button *ngIf="!notification.is_read" 
                (click)="markSingleNotificationRead(notification)"
                class="mark-read-btn">
          Marquer lu
        </button>
      </div>
    </div>
  </div>

  <!-- Overlay -->
  <div *ngIf="showNotifications || showUserMenu" 
       class="overlay"
       (click)="closeAllPanels()">
  </div>
</div>
  `,
  styles: [`
    /* Styles CSS ici - similaires à ceux du composant précédent */
    .dashboard-container {
      min-height: 100vh;
      background-color: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .dashboard-header {
      background: white;
      padding: 20px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .user-welcome h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2rem;
    }
    
    .user-welcome p {
      margin: 5px 0 0 0;
      color: #7f8c8d;
    }
    
    .header-actions {
      display: flex;
      gap: 15px;
      align-items: center;
    }
    
    .notification-button {
      position: relative;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 10px;
      border-radius: 50%;
    }
    
    .notification-button:hover {
      background: #f8f9fa;
    }
    
    .notification-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3498db;
      color: white;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }
    
    .user-dropdown {
      position: absolute;
      right: 0;
      top: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 200px;
      display: none;
    }
    
    .user-dropdown.show {
      display: block;
    }
    
    .user-dropdown a, .logout-btn {
      display: block;
      padding: 12px 16px;
      text-decoration: none;
      color: #2c3e50;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }
    
    .user-dropdown a:hover, .logout-btn:hover {
      background: #f8f9fa;
    }
    
    .logout-btn {
      color: #e74c3c;
    }
    
    .dashboard-main {
      padding: 30px 0;
    }
    
    .stats-section {
      margin-bottom: 30px;
    }
    
    .stats-section h2 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    
    .stat-icon.credit { background: #ffeaea; }
    .stat-icon.savings { background: #e8f5e8; }
    .stat-icon.insurance { background: #fff8e1; }
    .stat-icon.applications { background: #e3f2fd; }
    
    .stat-number {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
    }
    
    .stat-label {
      color: #7f8c8d;
      font-size: 14px;
    }
    
    .quick-actions-section {
      margin-bottom: 30px;
    }
    
    .quick-actions-section h2 {
      color: #2c3e50;
      margin-bottom: 20px;
    }
    
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .action-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border: none;
      text-align: left;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .action-icon {
      font-size: 2rem;
      margin-bottom: 15px;
    }
    
    .action-content h3 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }
    
    .action-content p {
      margin: 0;
      color: #7f8c8d;
    }
    
    .dashboard-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
    }
    
    .dashboard-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    .card-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .card-header h3 {
      margin: 0;
      color: #2c3e50;
    }
    
    .view-all-link {
      color: #3498db;
      text-decoration: none;
      font-size: 14px;
    }
    
    .view-all-link:hover {
      text-decoration: underline;
    }
    
    .card-content {
      padding: 20px;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px 20px;
    }
    
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 15px;
    }
    
    .empty-state p {
      color: #7f8c8d;
      margin-bottom: 20px;
    }
    
    .btn-primary {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }
    
    .btn-primary:hover {
      background: #2980b9;
    }
    
    .simulation-item, .application-item {
      display: flex;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
    }
    
    .simulation-item:last-child, .application-item:last-child {
      border-bottom: none;
    }
    
    .simulation-icon, .application-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      margin-right: 15px;
    }
    
    .simulation-icon.credit, .application-icon.credit { background: #ffeaea; }
    .simulation-icon.savings, .application-icon.savings { background: #e8f5e8; }
    .simulation-icon.insurance, .application-icon.insurance { background: #fff8e1; }
    
    .simulation-content, .application-content {
      flex: 1;
    }
    
    .simulation-content h4, .application-content h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }
    
    .bank-name {
      color: #7f8c8d;
      font-size: 14px;
      margin: 0 0 10px 0;
    }
    
    .simulation-results, .application-details {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .result-item, .amount {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .status.pending { background: #fff8e1; color: #f39c12; }
    .status.under_review { background: #e3f2fd; color: #1976d2; }
    .status.approved { background: #e8f5e8; color: #27ae60; }
    .status.rejected { background: #ffeaea; color: #e74c3c; }
    .status.on_hold { background: #f5f5f5; color: #7f8c8d; }
    .status.completed { background: #e8f5e8; color: #27ae60; }
    .status.active { background: #e8f5e8; color: #27ae60; }
    .status.opened { background: #e3f2fd; color: #1976d2; }
    
    .simulation-meta, .application-meta {
      font-size: 12px;
      color: #7f8c8d;
    }
    
    .simulation-actions, .application-actions {
      display: flex;
      gap: 10px;
    }
    
    .action-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .action-btn:hover {
      background: #f8f9fa;
    }
    
    .notifications-content {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 15px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .notification-item:hover {
      background: #f8f9fa;
    }
    
    .notification-item.unread {
      background: #f0f7ff;
    }
    
    .notification-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      margin-right: 15px;
      background: #f8f9fa;
    }
    
    .notification-content {
      flex: 1;
    }
    
    .notification-content h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }
    
    .notification-content p {
      margin: 0 0 5px 0;
      color: #7f8c8d;
      font-size: 14px;
    }
    
    .notification-time {
      font-size: 12px;
      color: #95a5a6;
    }
    
    .notification-status {
      display: flex;
      align-items: center;
    }
    
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3498db;
    }
    
    .mark-read-btn {
      background: none;
      border: none;
      color: #3498db;
      cursor: pointer;
      font-size: 14px;
    }
    
    .mark-read-btn:hover {
      text-decoration: underline;
    }
    
    .tips-card .tip-item {
      display: flex;
      align-items: flex-start;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
    }
    
    .tips-card .tip-item:last-child {
      border-bottom: none;
    }
    
    .tip-icon {
      font-size: 1.5rem;
      margin-right: 15px;
    }
    
    .tip-content h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }
    
    .tip-content p {
      margin: 0;
      color: #7f8c8d;
      font-size: 14px;
    }
    
    .notifications-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 20px rgba(0,0,0,0.15);
      z-index: 1001;
      transition: right 0.3s ease;
    }
    
    .notifications-panel.show {
      right: 0;
    }
    
    .panel-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .panel-header h3 {
      margin: 0;
      color: #2c3e50;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
    }
    
    .panel-content {
      padding: 20px;
      height: calc(100vh - 80px);
      overflow-y: auto;
    }
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
    }
  `]
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  dashboard: UserDashboard | null = null;
  allNotifications: UserNotification[] = [];
  isLoading = true;
  
  // États UI
  showNotifications = false;
  showUserMenu = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAllNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  private loadDashboard(): void {
    this.isLoading = true;
    
    this.authService.getDashboard().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.notificationService.showError('Erreur lors du chargement des données');
        this.isLoading = false;
      }
    });
  }

  private loadAllNotifications(): void {
    this.authService.getNotifications(false, 20).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (notifications) => {
        this.allNotifications = notifications;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    });
  }

  // ==================== ACTIONS UTILISATEUR ====================

  logout(): void {
    this.authService.logout().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        // Forcer la redirection même en cas d'erreur
        this.router.navigate(['/']);
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  closeAllPanels(): void {
    this.showNotifications = false;
    this.showUserMenu = false;
  }

  // ==================== GESTION DES NOTIFICATIONS ====================

  markNotificationRead(notification: UserNotification): void {
    if (!notification.is_read) {
      this.markSingleNotificationRead(notification);
    }
    
    // Naviguer vers l'entité liée si applicable
    if (notification.related_entity_type && notification.related_entity_id) {
      this.navigateToRelatedEntity(notification);
    }
  }

  markSingleNotificationRead(notification: UserNotification): void {
    this.authService.markNotificationsRead([notification.id]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        notification.is_read = true;
        // Mettre à jour le compteur
        if (this.dashboard?.stats) {
          this.dashboard.stats.unread_notifications = Math.max(0, this.dashboard.stats.unread_notifications - 1);
        }
      },
      error: (error) => {
        console.error('Erreur lors du marquage de notification:', error);
      }
    });
  }

  markAllNotificationsRead(): void {
    const unreadIds = this.allNotifications
      .filter(n => !n.is_read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    this.authService.markNotificationsRead(unreadIds).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Marquer toutes comme lues dans l'interface
        this.allNotifications.forEach(n => n.is_read = true);
        if (this.dashboard?.notifications) {
          this.dashboard.notifications.forEach(n => n.is_read = true);
        }
        
        // Réinitialiser le compteur
        if (this.dashboard?.stats) {
          this.dashboard.stats.unread_notifications = 0;
        }
        
        this.notificationService.showSuccess('Toutes les notifications ont été marquées comme lues');
      },
      error: (error) => {
        console.error('Erreur lors du marquage des notifications:', error);
        this.notificationService.showError('Erreur lors du marquage des notifications');
      }
    });
  }

  private navigateToRelatedEntity(notification: UserNotification): void {
    const entityType = notification.related_entity_type;
    const entityId = notification.related_entity_id;

    switch (entityType) {
      case 'credit_application':
        this.router.navigate(['/applications', 'credit', entityId]);
        break;
      case 'savings_application':
        this.router.navigate(['/applications', 'savings', entityId]);
        break;
      case 'insurance_application':
        this.router.navigate(['/applications', 'insurance', entityId]);
        break;
      default:
        // Navigation générale
        this.router.navigate(['/applications']);
    }
  }

  // ==================== ACTIONS SUR LES SIMULATIONS ====================

  viewSimulation(simulation: UserSimulation): void {
    // Naviguer vers la page de détail de la simulation
    switch (simulation.type) {
      case 'credit':
        this.router.navigate(['/simulations', 'credit', simulation.id]);
        break;
      case 'savings':
        this.router.navigate(['/simulations', 'savings', simulation.id]);
        break;
      case 'insurance':
        this.router.navigate(['/simulations', 'insurance', simulation.id]);
        break;
    }
  }

  createApplication(simulation: UserSimulation): void {
    // Naviguer vers le formulaire de demande pré-rempli
    const queryParams = { 
      simulation_id: simulation.id,
      product_name: simulation.product_name 
    };

    switch (simulation.type) {
      case 'credit':
        this.router.navigate(['/apply', 'credit'], { queryParams });
        break;
      case 'savings':
        this.router.navigate(['/apply', 'savings'], { queryParams });
        break;
      case 'insurance':
        this.router.navigate(['/apply', 'insurance'], { queryParams });
        break;
    }
  }

  viewApplication(application: UserApplication): void {
    this.router.navigate(['/applications', application.type, application.id]);
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  getFirstName(): string {
    return this.dashboard?.user?.first_name || 'Utilisateur';
  }

  getUserInitials(): string {
    const user = this.dashboard?.user;
    if (!user) return 'U';
    
    const firstInitial = user.first_name.charAt(0).toUpperCase();
    const lastInitial = user.last_name.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  getTotalApplications(): number {
    if (!this.dashboard?.stats) return 0;
    
    return this.dashboard.stats.total_credit_applications +
           this.dashboard.stats.total_savings_applications +
           this.dashboard.stats.total_insurance_applications;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'under_review': 'En cours d\'étude',
      'approved': 'Approuvée',
      'rejected': 'Refusée',
      'on_hold': 'En suspens',
      'completed': 'Terminée',
      'active': 'Active',
      'opened': 'Ouverte'
    };
    
    return statusLabels[status] || status;
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '0 FCFA';
    
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
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
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  // ==================== MÉTHODES DE RAFRAÎCHISSEMENT ====================

  refreshDashboard(): void {
    this.loadDashboard();
    this.loadAllNotifications();
  }

  // Méthode appelée lors du retour sur la page (par exemple depuis une simulation)
  onPageFocus(): void {
    // Rafraîchir les données si l'utilisateur revient après avoir fait une action
    this.refreshDashboard();
  }
}