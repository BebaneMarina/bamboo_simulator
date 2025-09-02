// src/app/app.component.ts (Standalone)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NotificationComponent } from './components/notifications/notification.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NotificationComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <app-loading-spinner 
        *ngIf="isLoading$ | async"
        class="global-loading">
      </app-loading-spinner>

      <main class="main-content" [class.loading]="isLoading$ | async">
        <router-outlet></router-outlet>
      </main>

      <app-notification></app-notification>
    </div>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent {
  isLoading$: typeof this.loadingService.loading$;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
  }
}