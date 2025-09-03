// src/app/user/credit-application.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../services/user-auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-credit-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="credit-application-container">
      <div class="container">
        
        <!-- Header -->
        <div class="application-header">
          <div class="breadcrumb">
            <a routerLink="/applications">Mes demandes</a>
            <span class="separator">›</span>
            <span>Nouvelle demande de crédit</span>
          </div>
          
          <h1>Demande de crédit</h1>
          <p>Remplissez le formulaire ci-dessous pour soumettre votre demande de crédit</p>
        </div>

        <!-- Progress steps -->
        <div class="progress-steps">
          <div 
            *ngFor="let step of steps; let i = index"
            class="step"
            [class.active]="currentStep === i"
            [class.completed]="i < currentStep">
            <div class="step-number">{{ i + 1 }}</div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>

        <!-- Form -->
        <form [formGroup]="applicationForm" (ngSubmit)="onSubmit()">
          
          <!-- Step 1: Credit Details -->
          <div *ngIf="currentStep === 0" class="form-step">
            <div class="step-card">
              <div class="card-header">
                <h2>Détails du crédit</h2>
                <p>Informations sur le crédit souhaité</p>
              </div>

              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="creditType">Type de crédit *</label>
                    <select id="creditType" formControlName="credit_type" class="form-select">
                      <option value="">Sélectionner le type</option>
                      <option value="immobilier">Crédit immobilier</option>
                      <option value="consommation">Crédit consommation</option>
                      <option value="auto">Crédit automobile</option>
                      <option value="travaux">Crédit travaux</option>
                      <option value="professionnel">Crédit professionnel</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="amount">Montant demandé (FCFA) *</label>
                    <input 
                      type="number" 
                      id="amount"
                      formControlName="amount"
                      class="form-input"
                      placeholder="Ex: 5 000 000"
                      min="100000"
                      max="100000000"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="duration">Durée souhaitée (mois) *</label>
                    <input 
                      type="number" 
                      id="duration"
                      formControlName="duration"
                      class="form-input"
                      placeholder="Ex: 240"
                      min="12"
                      max="360"
                    />
                  </div>

                  <div class="form-group">
                    <label for="bankName">Banque ou établissement *</label>
                    <select id="bankName" formControlName="bank_name" class="form-select">
                      <option value="">Choisir un établissement</option>
                      <option value="bgd">Banque Gabonaise de Développement</option>
                      <option value="bicig">BICIG</option>
                      <option value="bgfi">BGFI Bank</option>
                      <option value="uba">UBA Gabon</option>
                      <option value="orabank">Orabank</option>
                      <option value="ecobank">Ecobank</option>
                    </select>
                  </div>
                </div>

                <div class="form-group" *ngIf="getCreditType() === 'immobilier'">
                  <label for="downPayment">Apport personnel (FCFA)</label>
                  <input 
                    type="number" 
                    id="downPayment"
                    formControlName="down_payment"
                    class="form-input"
                    placeholder="Ex: 1 000 000"
                    min="0"
                  />
                </div>

                <div class="form-group">
                  <label for="purpose">Objet du crédit *</label>
                  <textarea 
                    id="purpose"
                    formControlName="purpose"
                    class="form-textarea"
                    rows="3"
                    placeholder="Décrivez l'objet de votre demande de crédit...">
                  </textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Personal Information -->
          <div *ngIf="currentStep === 1" class="form-step">
            <div class="step-card">
              <div class="card-header">
                <h2>Informations personnelles</h2>
                <p>Vos informations personnelles et professionnelles</p>
              </div>

              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="monthlyIncome">Revenus mensuels nets (FCFA) *</label>
                    <input 
                      type="number" 
                      id="monthlyIncome"
                      formControlName="monthly_income"
                      class="form-input"
                      placeholder="Ex: 750 000"
                      min="100000"
                    />
                  </div>

                  <div class="form-group">
                    <label for="employmentType">Type d'emploi *</label>
                    <select id="employmentType" formControlName="employment_type" class="form-select">
                      <option value="">Sélectionner</option>
                      <option value="cdi">CDI</option>
                      <option value="cdd">CDD</option>
                      <option value="fonctionnaire">Fonctionnaire</option>
                      <option value="liberal">Profession libérale</option>
                      <option value="entrepreneur">Entrepreneur</option>
                      <option value="retraite">Retraité</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="employer">Employeur *</label>
                    <input 
                      type="text" 
                      id="employer"
                      formControlName="employer"
                      class="form-input"
                      placeholder="Nom de votre employeur"
                    />
                  </div>

                  <div class="form-group">
                    <label for="workExperience">Ancienneté (années)</label>
                    <input 
                      type="number" 
                      id="workExperience"
                      formControlName="work_experience"
                      class="form-input"
                      placeholder="Ex: 5"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="currentDebts">Dettes actuelles (FCFA)</label>
                    <input 
                      type="number" 
                      id="currentDebts"
                      formControlName="current_debts"
                      class="form-input"
                      placeholder="Ex: 150 000"
                      min="0"
                    />
                  </div>

                  <div class="form-group">
                    <label for="familyStatus">Situation familiale</label>
                    <select id="familyStatus" formControlName="family_status" class="form-select">
                      <option value="">Sélectionner</option>
                      <option value="single">Célibataire</option>
                      <option value="married">Marié(e)</option>
                      <option value="divorced">Divorcé(e)</option>
                      <option value="widowed">Veuf/Veuve</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="dependents">Nombre de personnes à charge</label>
                  <input 
                    type="number" 
                    id="dependents"
                    formControlName="dependents"
                    class="form-input"
                    placeholder="Ex: 2"
                    min="0"
                    max="20"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Documents -->
          <div *ngIf="currentStep === 2" class="form-step">
            <div class="step-card">
              <div class="card-header">
                <h2>Documents requis</h2>
                <p>Téléchargez les documents nécessaires pour votre demande</p>
              </div>

              <div class="card-body">
                <div class="document-requirements">
                  <h3>Documents obligatoires :</h3>
                  <div class="required-docs">
                    <div class="doc-item">
                      <div class="doc-icon">📄</div>
                      <div class="doc-info">
                        <strong>Pièce d'identité</strong>
                        <p>CNI, passeport ou permis de conduire</p>
                      </div>
                      <input 
                        type="file" 
                        (change)="onFileSelected($event, 'identity')"
                        accept=".pdf,.jpg,.jpeg,.png"
                        class="file-input"
                        id="identity-doc"
                      />
                      <label for="identity-doc" class="file-label">
                        {{ getDocumentStatus('identity') }}
                      </label>
                    </div>

                    <div class="doc-item">
                      <div class="doc-icon">📊</div>
                      <div class="doc-info">
                        <strong>Bulletins de salaire</strong>
                        <p>3 derniers bulletins de salaire</p>
                      </div>
                      <input 
                        type="file" 
                        (change)="onFileSelected($event, 'payslips')"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        class="file-input"
                        id="payslips-doc"
                      />
                      <label for="payslips-doc" class="file-label">
                        {{ getDocumentStatus('payslips') }}
                      </label>
                    </div>

                    <div class="doc-item">
                      <div class="doc-icon">🏦</div>
                      <div class="doc-info">
                        <strong>Relevés bancaires</strong>
                        <p>3 derniers relevés de compte</p>
                      </div>
                      <input 
                        type="file" 
                        (change)="onFileSelected($event, 'bank_statements')"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        class="file-input"
                        id="bank-statements-doc"
                      />
                      <label for="bank-statements-doc" class="file-label">
                        {{ getDocumentStatus('bank_statements') }}
                      </label>
                    </div>
                  </div>

                  <h3>Documents optionnels :</h3>
                  <div class="optional-docs">
                    <div class="doc-item">
                      <div class="doc-icon">📋</div>
                      <div class="doc-info">
                        <strong>Attestation de travail</strong>
                        <p>Attestation d'emploi récente</p>
                      </div>
                      <input 
                        type="file" 
                        (change)="onFileSelected($event, 'work_certificate')"
                        accept=".pdf,.jpg,.jpeg,.png"
                        class="file-input"
                        id="work-cert-doc"
                      />
                      <label for="work-cert-doc" class="file-label">
                        {{ getDocumentStatus('work_certificate') }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Review -->
          <div *ngIf="currentStep === 3" class="form-step">
            <div class="step-card">
              <div class="card-header">
                <h2>Vérification et soumission</h2>
                <p>Vérifiez les informations avant de soumettre votre demande</p>
              </div>

              <div class="card-body">
                <div class="review-section">
                  <h3>Détails du crédit</h3>
                  <div class="review-grid">
                    <div class="review-item">
                      <label>Type de crédit :</label>
                      <span>{{ getCreditTypeLabel() }}</span>
                    </div>
                    <div class="review-item">
                      <label>Montant demandé :</label>
                      <span>{{ formatCurrency(applicationForm.get('amount')?.value) }}</span>
                    </div>
                    <div class="review-item">
                      <label>Durée :</label>
                      <span>{{ applicationForm.get('duration')?.value }} mois</span>
                    </div>
                    <div class="review-item">
                      <label>Établissement :</label>
                      <span>{{ getBankLabel() }}</span>
                    </div>
                  </div>
                </div>

                <div class="review-section">
                  <h3>Informations personnelles</h3>
                  <div class="review-grid">
                    <div class="review-item">
                      <label>Revenus mensuels :</label>
                      <span>{{ formatCurrency(applicationForm.get('monthly_income')?.value) }}</span>
                    </div>
                    <div class="review-item">
                      <label>Type d'emploi :</label>
                      <span>{{ getEmploymentTypeLabel() }}</span>
                    </div>
                    <div class="review-item">
                      <label>Employeur :</label>
                      <span>{{ applicationForm.get('employer')?.value }}</span>
                    </div>
                  </div>
                </div>

                <div class="review-section">
                  <h3>Documents téléchargés</h3>
                  <div class="documents-summary">
                    <div *ngFor="let docType of getUploadedDocuments()" class="doc-summary">
                      <div class="doc-icon">✅</div>
                      <span>{{ getDocumentLabel(docType) }}</span>
                    </div>
                  </div>
                </div>

                <div class="terms-section">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="accept_terms">
                    <span class="checkmark"></span>
                    J'accepte les <a href="/terms" target="_blank">conditions générales</a> et confirme l'exactitude des informations fournies
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation buttons -->
          <div class="form-navigation">
            <button 
              *ngIf="currentStep > 0"
              type="button" 
              (click)="previousStep()"
              class="btn-outline">
              Précédent
            </button>

            <button 
              *ngIf="currentStep < steps.length - 1"
              type="button" 
              (click)="nextStep()"
              [disabled]="!isCurrentStepValid()"
              class="btn-primary">
              Suivant
            </button>

            <button 
              *ngIf="currentStep === steps.length - 1"
              type="submit" 
              [disabled]="applicationForm.invalid || isSubmitting"
              class="btn-success">
              {{ isSubmitting ? 'Soumission...' : 'Soumettre la demande' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CreditApplicationComponent implements OnInit, OnDestroy {
  applicationForm!: FormGroup;
  currentStep = 0;
  isSubmitting = false;
  
  steps = [
    { label: 'Détails du crédit' },
    { label: 'Informations personnelles' },
    { label: 'Documents' },
    { label: 'Vérification' }
  ];

  uploadedDocuments: { [key: string]: File[] } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPrefilledData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.applicationForm = this.fb.group({
      // Credit details
      credit_type: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(100000)]],
      duration: ['', [Validators.required, Validators.min(12), Validators.max(360)]],
      bank_name: ['', Validators.required],
      down_payment: [0],
      purpose: ['', Validators.required],
      
      // Personal information
      monthly_income: ['', [Validators.required, Validators.min(100000)]],
      employment_type: ['', Validators.required],
      employer: ['', Validators.required],
      work_experience: [0],
      current_debts: [0],
      family_status: [''],
      dependents: [0],
      
      // Terms
      accept_terms: [false, Validators.requiredTrue]
    });
  }

  private loadPrefilledData(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['simulation_id']) {
        // Charger les données depuis une simulation
        this.loadFromSimulation(params['simulation_id']);
      } else if (params['edit']) {
        // Charger les données d'une demande existante
        this.loadExistingApplication(params['edit']);
      } else {
        // Pré-remplir avec les données disponibles
        if (params['amount']) this.applicationForm.patchValue({ amount: params['amount'] });
        if (params['bank_name']) this.applicationForm.patchValue({ bank_name: params['bank_name'] });
        if (params['product_name']) this.applicationForm.patchValue({ purpose: params['product_name'] });
      }
    });
  }

  private loadFromSimulation(simulationId: string): void {
    this.authService.getSimulation(simulationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (simulation: { parameters: any; product_name: any; }) => {
        const params = simulation.parameters;
        this.applicationForm.patchValue({
          amount: params?.amount,
          duration: params?.duration,
          monthly_income: params?.monthly_income,
          current_debts: params?.current_debts,
          purpose: `Basé sur la simulation ${simulation.product_name}`
        });
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de la simulation:', error);
      }
    });
  }

  private loadExistingApplication(applicationId: string): void {
    this.authService.getApplication(applicationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (application: { [key: string]: any; }) => {
        this.applicationForm.patchValue(application);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de la demande:', error);
      }
    });
  }

  nextStep(): void {
    if (this.isCurrentStepValid() && this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    const requiredFieldsByStep = {
      0: ['credit_type', 'amount', 'duration', 'bank_name', 'purpose'],
      1: ['monthly_income', 'employment_type', 'employer'],
      2: [], // Documents step - check if required docs are uploaded
      3: ['accept_terms']
    };

    const requiredFields = requiredFieldsByStep[this.currentStep as keyof typeof requiredFieldsByStep] || [];
    
    for (const field of requiredFields) {
      const control = this.applicationForm.get(field);
      if (!control || !control.value || control.invalid) {
        return false;
      }
    }

    // Check required documents for step 2
    if (this.currentStep === 2) {
      const requiredDocs = ['identity', 'payslips', 'bank_statements'];
      return requiredDocs.every(doc => this.uploadedDocuments[doc]?.length > 0);
    }

    return true;
  }

  onFileSelected(event: any, documentType: string): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadedDocuments[documentType] = Array.from(files);
    }
  }

  getDocumentStatus(documentType: string): string {
    const files = this.uploadedDocuments[documentType];
    if (files && files.length > 0) {
      return files.length === 1 ? `${files.length} fichier sélectionné` : `${files.length} fichiers sélectionnés`;
    }
    return 'Sélectionner fichier(s)';
  }

  getUploadedDocuments(): string[] {
    return Object.keys(this.uploadedDocuments).filter(key => 
      this.uploadedDocuments[key]?.length > 0
    );
  }

  onSubmit(): void {
    if (this.applicationForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const applicationData = {
      ...this.applicationForm.value,
      documents: this.uploadedDocuments
    };
    this.authService.submitCreditApplication(applicationData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: { id: any; }) => {
        this.isSubmitting = false;
        this.notificationService.showSuccess('Demande de crédit soumise avec succès !');
        this.router.navigate(['/applications/credit', response.id]);
      },
      error: (error: { message: any; }) => {
        this.isSubmitting = false;
        this.notificationService.showError(error.message || 'Erreur lors de la soumission');
      }
    });
  }

  // Utility methods
  getCreditType(): string {
    return this.applicationForm.get('credit_type')?.value || '';
  }

  getCreditTypeLabel(): string {
    const types: { [key: string]: string } = {
      'immobilier': 'Crédit immobilier',
      'consommation': 'Crédit consommation',
      'auto': 'Crédit automobile',
      'travaux': 'Crédit travaux',
      'professionnel': 'Crédit professionnel'
    };
    return types[this.getCreditType()] || '';
  }

  getBankLabel(): string {
    const banks: { [key: string]: string } = {
      'bgd': 'Banque Gabonaise de Développement',
      'bicig': 'BICIG',
      'bgfi': 'BGFI Bank',
      'uba': 'UBA Gabon',
      'orabank': 'Orabank',
      'ecobank': 'Ecobank'
    };
    const bankCode = this.applicationForm.get('bank_name')?.value;
    return banks[bankCode] || bankCode;
  }

  getEmploymentTypeLabel(): string {
    const types: { [key: string]: string } = {
      'cdi': 'CDI',
      'cdd': 'CDD',
      'fonctionnaire': 'Fonctionnaire',
      'liberal': 'Profession libérale',
      'entrepreneur': 'Entrepreneur',
      'retraite': 'Retraité'
    };
    const empType = this.applicationForm.get('employment_type')?.value;
    return types[empType] || '';
  }

  getDocumentLabel(docType: string): string {
    const labels: { [key: string]: string } = {
      'identity': 'Pièce d\'identité',
      'payslips': 'Bulletins de salaire',
      'bank_statements': 'Relevés bancaires',
      'work_certificate': 'Attestation de travail'
    };
    return labels[docType] || docType;
  }

  formatCurrency(amount: number): string {
    if (!amount) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA';
  }
}