// admin/src/app/auth/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.services';
import { LoginRequest } from '../models/interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img src="/assets/bamboo-logo.png" alt="Bamboo" class="logo">
          <h1>Bamboo Admin</h1>
          <p>Connectez-vous à votre espace administrateur</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Nom d'utilisateur</label>
            <input 
              type="text" 
              id="username"
              formControlName="username"
              class="form-control"
              [class.error]="hasError('username')"
              placeholder="Entrez votre nom d'utilisateur">
            <div *ngIf="hasError('username')" class="error-message">
              {{ getErrorMessage('username') }}
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input 
              type="password" 
              id="password"
              formControlName="password"
              class="form-control"
              [class.error]="hasError('password')"
              placeholder="Entrez votre mot de passe">
            <div *ngIf="hasError('password')" class="error-message">
              {{ getErrorMessage('password') }}
            </div>
          </div>

          <div *ngIf="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading"
            class="btn btn-primary btn-full">
            {{ isLoading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <div class="login-footer">
          <p>Mot de passe oublié ? <a href="#" (click)="forgotPassword($event)">Récupérer</a></p>
          <div class="demo-credentials">
            <h4>Comptes de démonstration :</h4>
            <div class="demo-account">
              <strong>Super Admin:</strong> superadmin / BambooAdmin2024!
            </div>
            <div class="demo-account">
              <strong>Admin:</strong> admin_credit / BambooAdmin2024!
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private adminAuth: AdminAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
    
    // Rediriger si déjà connecté
    if (this.adminAuth.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = this.loginForm.value;

    this.adminAuth.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur de connexion';
      }
    });
  }

  hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control?.errors && control?.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control?.errors) return '';

    if (control.errors['required']) {
      return 'Ce champ est requis';
    }

    return 'Valeur invalide';
  }

  forgotPassword(event: Event): void {
    event.preventDefault();
    alert('Contactez l\'administrateur système pour récupérer votre mot de passe.');
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
