// login.component.ts - Composant de connexion/inscription

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { AuthService, User, LoginRequest, RegisterRequest, VerificationRequest } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-header">
          <div class="logo">
            <h1>Bamboo</h1>
            <span class="tagline">Votre comparateur financier</span>
          </div>
          
          <!-- Tabs de navigation -->
          <div class="auth-tabs">
            <button 
              [class.active]="currentTab === 'login'"
              (click)="switchTab('login')"
              class="tab-button">
              Connexion
            </button>
            <button 
              [class.active]="currentTab === 'register'"
              (click)="switchTab('register')"
              class="tab-button">
              Inscription
            </button>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="auth-content">
          
          <!-- FORMULAIRE DE CONNEXION -->
          <div *ngIf="currentTab === 'login'" class="auth-form">
            <h2>Connectez-vous à votre compte</h2>
            <p class="form-subtitle">Accédez à vos simulations et demandes sauvegardées</p>

            <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
              <!-- Méthode de connexion -->
              <div class="connection-method-toggle">
                <button 
                  type="button"
                  [class.active]="loginMethod === 'email'"
                  (click)="setLoginMethod('email')"
                  class="method-button">
                  <span class="method-icon">📧</span>
                  Email
                </button>
                <button 
                  type="button"
                  [class.active]="loginMethod === 'phone'"
                  (click)="setLoginMethod('phone')"
                  class="method-button">
                  <span class="method-icon">📱</span>
                  Téléphone
                </button>
              </div>

              <!-- Champs de connexion -->
              <div class="form-group">
                <label *ngIf="loginMethod === 'email'" for="loginEmail">Adresse email</label>
                <label *ngIf="loginMethod === 'phone'" for="loginPhone">Numéro de téléphone</label>
                
                <input 
                  *ngIf="loginMethod === 'email'"
                  type="email" 
                  id="loginEmail"
                  formControlName="email"
                  class="form-input"
                  [class.error]="loginForm.get('email')?.errors && loginForm.get('email')?.touched"
                  placeholder="votre@email.com"
                />
                
                <input 
                  *ngIf="loginMethod === 'phone'"
                  type="tel" 
                  id="loginPhone"
                  formControlName="phone"
                  class="form-input"
                  [class.error]="loginForm.get('phone')?.errors && loginForm.get('phone')?.touched"
                  placeholder="+241 XX XX XX XX"
                />
                
                <div *ngIf="loginMethod === 'email' && loginForm.get('email')?.errors?.['email'] && loginForm.get('email')?.touched" 
                     class="error-message">
                  Format d'email invalide
                </div>
                <div *ngIf="loginMethod === 'phone' && loginForm.get('phone')?.errors?.['pattern'] && loginForm.get('phone')?.touched" 
                     class="error-message">
                  Format de téléphone invalide
                </div>
              </div>

              <div class="form-group">
                <label for="loginPassword">Mot de passe</label>
                <div class="password-input-container">
                  <input 
                    [type]="showLoginPassword ? 'text' : 'password'"
                    id="loginPassword"
                    formControlName="password"
                    class="form-input"
                    [class.error]="loginForm.get('password')?.errors && loginForm.get('password')?.touched"
                    placeholder="Votre mot de passe"
                  />
                  <button 
                    type="button"
                    class="password-toggle"
                    (click)="showLoginPassword = !showLoginPassword">
                    {{ showLoginPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
                <div *ngIf="loginForm.get('password')?.errors?.['required'] && loginForm.get('password')?.touched" 
                     class="error-message">
                  Mot de passe requis
                </div>
              </div>

              <div class="form-options">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="remember_me">
                  <span class="checkmark"></span>
                  Se souvenir de moi
                </label>
                
                <button type="button" (click)="showForgotPassword = true" class="link-button">
                  Mot de passe oublié ?
                </button>
              </div>

              <button 
                type="submit" 
                [disabled]="loginForm.invalid || isLoading"
                class="btn-primary">
                {{ isLoading ? 'Connexion...' : 'Se connecter' }}
              </button>
            </form>
          </div>

          <!-- FORMULAIRE D'INSCRIPTION -->
          <div *ngIf="currentTab === 'register'" class="auth-form">
            <h2>Créez votre compte Bamboo</h2>
            <p class="form-subtitle">Accédez à tous nos services financiers</p>

            <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
              <!-- Méthode d'inscription -->
              <div class="connection-method-toggle">
                <button 
                  type="button"
                  [class.active]="registerMethod === 'email'"
                  (click)="setRegisterMethod('email')"
                  class="method-button">
                  <span class="method-icon">📧</span>
                  Email
                </button>
                <button 
                  type="button"
                  [class.active]="registerMethod === 'phone'"
                  (click)="setRegisterMethod('phone')"
                  class="method-button">
                  <span class="method-icon">📱</span>
                  SMS
                </button>
              </div>

              <!-- Informations personnelles -->
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">Prénom *</label>
                  <input 
                    type="text" 
                    id="firstName"
                    formControlName="first_name"
                    class="form-input"
                    [class.error]="registerForm.get('first_name')?.errors && registerForm.get('first_name')?.touched"
                    placeholder="Votre prénom"
                  />
                  <div *ngIf="registerForm.get('first_name')?.errors?.['required'] && registerForm.get('first_name')?.touched" 
                       class="error-message">
                    Prénom requis
                  </div>
                </div>

                <div class="form-group">
                  <label for="lastName">Nom *</label>
                  <input 
                    type="text" 
                    id="lastName"
                    formControlName="last_name"
                    class="form-input"
                    [class.error]="registerForm.get('last_name')?.errors && registerForm.get('last_name')?.touched"
                    placeholder="Votre nom"
                  />
                  <div *ngIf="registerForm.get('last_name')?.errors?.['required'] && registerForm.get('last_name')?.touched" 
                       class="error-message">
                    Nom requis
                  </div>
                </div>
              </div>

              <!-- Contact -->
              <div class="form-group">
                <label *ngIf="registerMethod === 'email'" for="registerEmail">Adresse email *</label>
                <label *ngIf="registerMethod === 'phone'" for="registerPhone">Numéro de téléphone *</label>
                
                <input 
                  *ngIf="registerMethod === 'email'"
                  type="email" 
                  id="registerEmail"
                  formControlName="email"
                  class="form-input"
                  [class.error]="registerForm.get('email')?.errors && registerForm.get('email')?.touched"
                  placeholder="votre@email.com"
                />
                
                <input 
                  *ngIf="registerMethod === 'phone'"
                  type="tel" 
                  id="registerPhone"
                  formControlName="phone"
                  class="form-input"
                  [class.error]="registerForm.get('phone')?.errors && registerForm.get('phone')?.touched"
                  placeholder="+241 XX XX XX XX"
                />
              </div>

              <!-- Mot de passe (requis pour email) -->
              <div *ngIf="registerMethod === 'email'" class="form-group">
                <label for="registerPassword">Mot de passe *</label>
                <div class="password-input-container">
                  <input 
                    [type]="showRegisterPassword ? 'text' : 'password'"
                    id="registerPassword"
                    formControlName="password"
                    class="form-input"
                    [class.error]="registerForm.get('password')?.errors && registerForm.get('password')?.touched"
                    placeholder="Minimum 8 caractères"
                  />
                  <button 
                    type="button"
                    class="password-toggle"
                    (click)="showRegisterPassword = !showRegisterPassword">
                    {{ showRegisterPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
                <div class="password-strength" *ngIf="registerForm.get('password')?.value">
                  <div class="strength-bar" [class]="getPasswordStrength()"></div>
                  <span class="strength-text">{{ getPasswordStrengthText() }}</span>
                </div>
                <div *ngIf="registerForm.get('password')?.errors?.['minlength'] && registerForm.get('password')?.touched" 
                     class="error-message">
                  Le mot de passe doit contenir au moins 8 caractères
                </div>
              </div>

              <!-- Informations optionnelles -->
              <div class="optional-section" [class.expanded]="showOptionalFields">
                <button 
                  type="button" 
                  class="toggle-optional"
                  (click)="showOptionalFields = !showOptionalFields">
                  {{ showOptionalFields ? 'Masquer' : 'Informations supplémentaires' }} (optionnel)
                  <span class="toggle-icon">{{ showOptionalFields ? '▲' : '▼' }}</span>
                </button>

                <div *ngIf="showOptionalFields" class="optional-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="dateOfBirth">Date de naissance</label>
                      <input 
                        type="date" 
                        id="dateOfBirth"
                        formControlName="date_of_birth"
                        class="form-input"
                      />
                    </div>

                    <div class="form-group">
                      <label for="gender">Genre</label>
                      <select id="gender" formControlName="gender" class="form-select">
                        <option value="">Sélectionner</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="profession">Profession</label>
                      <input 
                        type="text" 
                        id="profession"
                        formControlName="profession"
                        class="form-input"
                        placeholder="Votre profession"
                      />
                    </div>

                    <div class="form-group">
                      <label for="city">Ville</label>
                      <select id="city" formControlName="city" class="form-select">
                        <option value="">Sélectionner votre ville</option>
                        <option value="libreville">Libreville</option>
                        <option value="port-gentil">Port-Gentil</option>
                        <option value="franceville">Franceville</option>
                        <option value="oyem">Oyem</option>
                        <option value="lambarene">Lambaréné</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="monthlyIncome">Revenus mensuels (FCFA)</label>
                    <input 
                      type="number" 
                      id="monthlyIncome"
                      formControlName="monthly_income"
                      class="form-input"
                      placeholder="Ex: 750 000"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                [disabled]="registerForm.invalid || isLoading"
                class="btn-primary">
                {{ isLoading ? 'Inscription...' : 'Créer mon compte' }}
              </button>
            </form>
          </div>

          <!-- VÉRIFICATION -->
          <div *ngIf="currentTab === 'verify'" class="auth-form">
            <h2>Vérifiez votre {{ verificationMethod === 'email' ? 'email' : 'téléphone' }}</h2>
            <p class="form-subtitle">
              Nous avons envoyé un code de vérification à 
              <strong>{{ verificationContact }}</strong>
            </p>

            <form [formGroup]="verifyForm" (ngSubmit)="onVerify()">
              <div class="form-group">
                <label for="verifyCode">Code de vérification</label>
                <input 
                  type="text" 
                  id="verifyCode"
                  formControlName="code"
                  class="form-input code-input"
                  [class.error]="verifyForm.get('code')?.errors && verifyForm.get('code')?.touched"
                  placeholder="000000"
                  maxlength="6"
                />
                <div *ngIf="verifyForm.get('code')?.errors?.['required'] && verifyForm.get('code')?.touched" 
                     class="error-message">
                  Code de vérification requis
                </div>
              </div>

              <div class="verification-actions">
                <button 
                  type="button"
                  (click)="resendCode()"
                  [disabled]="resendCooldown > 0"
                  class="link-button">
                  {{ resendCooldown > 0 ? `,
  styleUrls: ['./user-login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  // Formulaires
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  verifyForm!: FormGroup;
  forgotPasswordForm!: FormGroup;

  // États
  currentTab: 'login' | 'register' | 'verify' = 'login';
  loginMethod: 'email' | 'phone' = 'email';
  registerMethod: 'email' | 'phone' = 'email';
  forgotMethod: 'email' | 'phone' = 'email';
  
  isLoading = false;
  showLoginPassword = false;
  showRegisterPassword = false;
  showOptionalFields = false;
  showForgotPassword = false;
  
  // Vérification
  verificationMethod?: string;
  verificationContact?: string;
  resendCooldown = 0;
  
  // Messages
  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';

  private destroy$ = new Subject<void>();
  private resendTimer?: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.checkAuthState();
    this.handleRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]],
      password: ['', [Validators.required]],
      remember_me: [false]
    });

    this.registerForm = this.fb.group({
      registration_method: ['email'],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.minLength(8)]],
      date_of_birth: [''],
      gender: [''],
      profession: [''],
      city: [''],
      monthly_income: ['', [Validators.min(0)]]
    });

    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]]
    });

    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    // Validation dynamique selon la méthode choisie
    this.loginForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300)
    ).subscribe(() => {
      this.updateLoginValidation();
    });

    this.registerForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300)
    ).subscribe(() => {
      this.updateRegisterValidation();
    });
  }

  private updateLoginValidation(): void {
    const emailControl = this.loginForm.get('email');
    const phoneControl = this.loginForm.get('phone');

    if (this.loginMethod === 'email') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.clearValidators();
    } else {
      phoneControl?.setValidators([Validators.required, Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]);
      emailControl?.clearValidators();
    }

    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
  }

  private updateRegisterValidation(): void {
    const emailControl = this.registerForm.get('email');
    const phoneControl = this.registerForm.get('phone');
    const passwordControl = this.registerForm.get('password');

    if (this.registerMethod === 'email') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.clearValidators();
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      phoneControl?.setValidators([Validators.required, Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]);
      emailControl?.clearValidators();
      passwordControl?.clearValidators();
    }

    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
  }

  private checkAuthState(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  private handleRouteParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['tab']) {
        this.currentTab = params['tab'];
      }
      if (params['method']) {
        this.loginMethod = params['method'];
        this.registerMethod = params['method'];
      }
    });
  }

  // ==================== NAVIGATION ====================

  switchTab(tab: 'login' | 'register'): void {
    this.currentTab = tab;
    this.clearMessages();
    this.router.navigate([], { 
      queryParams: { tab }, 
      queryParamsHandling: 'merge' 
    });
  }

  setLoginMethod(method: 'email' | 'phone'): void {
    this.loginMethod = method;
    this.loginForm.reset({ remember_me: false });
    this.updateLoginValidation();
  }

  setRegisterMethod(method: 'email' | 'phone'): void {
    this.registerMethod = method;
    this.registerForm.patchValue({ registration_method: method });
    this.updateRegisterValidation();
  }

  setForgotMethod(method: 'email' | 'phone'): void {
    this.forgotMethod = method;
    this.forgotPasswordForm.reset();
  }

  // ==================== ACTIONS ====================

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const loginData: LoginRequest = {
      password: this.loginForm.get('password')?.value,
      remember_me: this.loginForm.get('remember_me')?.value
    };

    if (this.loginMethod === 'email') {
      loginData.email = this.loginForm.get('email')?.value;
    } else {
      loginData.phone = this.loginForm.get('phone')?.value;
    }

    this.authService.login(loginData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage('Connexion réussie ! Redirection...', 'success');
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage(error.message, 'error');
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const registerData: RegisterRequest = {
      ...this.registerForm.value,
      registration_method: this.registerMethod
    };

    this.authService.register(registerData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.verification_required) {
          this.verificationMethod = response.verification_method;
          this.verificationContact = this.registerMethod === 'email' 
            ? registerData.email 
            : registerData.phone;
          this.currentTab = 'verify';
          this.showMessage('Code de vérification envoyé !', 'success');
        } else {
          this.showMessage('Inscription réussie ! Redirection...', 'success');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage(error.message, 'error');
      }
    });
  }

  onVerify(): void {
    if (this.verifyForm.invalid) {
      this.markFormGroupTouched(this.verifyForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const verificationData: VerificationRequest = {
      code: this.verifyForm.get('code')?.value
    };

    if (this.verificationMethod === 'email') {
      verificationData.email = this.verificationContact;
    } else {
      verificationData.phone = this.verificationContact;
    }

    this.authService.verify(verificationData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage('Compte vérifié avec succès ! Redirection...', 'success');
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage(error.message, 'error');
      }
    });
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const resetData = this.forgotMethod === 'email' 
      ? { email: this.forgotPasswordForm.get('email')?.value }
      : { phone: this.forgotPasswordForm.get('phone')?.value };

    this.authService.requestPasswordReset(resetData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage('Code de récupération envoyé !', 'success');
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage(error.message, 'error');
      }
    });
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;

    const resendData = this.verificationMethod === 'email'
      ? { email: this.verificationContact }
      : { phone: this.verificationContact };

    this.authService.resendVerification(resendData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showMessage('Code renvoyé !', 'success');
        this.startResendCooldown();
      },
      error: (error) => {
        this.showMessage(error.message, 'error');
      }
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  goBackToRegister(): void {
    this.currentTab = 'register';
    this.verifyForm.reset();
  }

  // ==================== UTILITAIRES ====================

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthClasses = ['very-weak', 'weak', 'fair', 'good', 'strong'];
    return strengthClasses[Math.min(strength, 4)];
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const texts = {
      'very-weak': 'Très faible',
      'weak': 'Faible',
      'fair': 'Moyen',
      'good': 'Bon',
      'strong': 'Fort'
    };
    return texts[strength as keyof typeof texts] || '';
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusMessage = message;
    this.statusType = type;

    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
      this.clearMessages();
    }, 5000);
  }

  private clearMessages(): void {
    this.statusMessage = '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}