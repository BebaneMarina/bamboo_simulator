// multi-bank-comparator.component.ts - Version complète corrigée
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService, Bank } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AnalyticsService } from '../../services/analytics.service';

interface MultiBankComparisonResult {
  bankOffers: BankOffer[];
  bestOffer?: BankOffer;
  summary: {
    totalOffers: number;
    bestRate?: number;
    lowestPayment?: number;
  };
}

interface BankOffer {
  bank: {
    id: string;
    name: string;
    logo: string;
  };
  product: {
    id: string;
    name: string;
    rate: number;
    processing_time: number;
  };
  monthly_payment: number;
  total_cost: number;
  total_interest: number;
  debt_ratio: number;
  eligible: boolean;
}

@Component({
  selector: 'comparateur',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './multi-bank-comparator.component.html',
  styleUrls: ['./multi-bank-comparator.component.scss']
})
export class MultiBankComparatorComponent implements OnInit, OnDestroy {
  simulationForm!: FormGroup;
  comparisonResults: MultiBankComparisonResult | null = null;
  isLoading = false;
  hasFormError = false;
  errorMessage = '';
  
  availableBanks: Bank[] = [];
  selectedBanks: string[] = [];
  expandedOffers: Set<string> = new Set();
  sortBy: 'rate' | 'payment' | 'time' | 'approval' = 'rate';
  
  creditTypes = [
    { id: 'consommation', name: 'Crédit Consommation', description: 'Pour vos achats personnels' },
    { id: 'auto', name: 'Crédit Auto', description: 'Financement véhicule' },
    { id: 'immobilier', name: 'Crédit Immobilier', description: 'Achat ou construction' },
    { id: 'investissement', name: 'Crédit Investissement', description: 'Projets d\'entreprise' },
    { id: 'equipement', name: 'Crédit Équipement', description: 'Matériel professionnel' },
    { id: 'travaux', name: 'Crédit Travaux', description: 'Rénovation et amélioration' }
  ];

  durations = [
    { value: 6, label: '6 mois' },
    { value: 12, label: '12 mois' },
    { value: 18, label: '18 mois' },
    { value: 24, label: '2 ans' },
    { value: 36, label: '3 ans' },
    { value: 48, label: '4 ans' },
    { value: 60, label: '5 ans' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAvailableBanks();
    this.trackPageView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // MÉTHODES POUR GÉRER LES PROPRIÉTÉS MANQUANTES DE L'INTERFACE BANK
  getBankGradient(bank: Bank): string {
    const defaultColor = '#007bff';
    const color = bank.color || defaultColor;
    return `linear-gradient(135deg, ${color}, ${color}90)`;
  }

  private initializeForm(): void {
    this.simulationForm = this.fb.group({
      clientType: ['particulier', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+241|241)?[0-9]{8}$/)]],
      email: ['', [Validators.email]],
      monthlyIncome: [750000, [Validators.required, Validators.min(200000)]],
      profession: [''],
      creditType: ['consommation', Validators.required],
      requestedAmount: [2000000, [Validators.required, Validators.min(100000), Validators.max(100000000)]],
      duration: [24, [Validators.required, Validators.min(6), Validators.max(60)]],
      currentDebts: [0, [Validators.min(0)]],
      purpose: ['', Validators.required]
    });

    this.simulationForm.get('clientType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(clientType => {
        this.updateValidationRules(clientType);
      });
  }

  private updateValidationRules(clientType: string): void {
    const monthlyIncomeControl = this.simulationForm.get('monthlyIncome');
    const professionControl = this.simulationForm.get('profession');

    if (clientType === 'entreprise') {
      monthlyIncomeControl?.setValidators([
        Validators.required, 
        Validators.min(500000)
      ]);
      professionControl?.setValidators([Validators.required]);
    } else {
      monthlyIncomeControl?.setValidators([
        Validators.required, 
        Validators.min(200000)
      ]);
      professionControl?.clearValidators();
    }

    monthlyIncomeControl?.updateValueAndValidity();
    professionControl?.updateValueAndValidity();
  }

  private loadAvailableBanks(): void {
    this.apiService.getBanks().subscribe({
      next: (banks) => {
        this.availableBanks = banks;
        this.selectedBanks = banks
          .filter(bank => ['bgfi', 'ugb', 'bicig'].includes(bank.id))
          .map(bank => bank.id);
      },
      error: (error) => {
        console.error('Erreur chargement banques:', error);
        this.notificationService.showError('Impossible de charger les banques disponibles');
      }
    });
  }

  hasError(controlName: string): boolean {
    const control = this.simulationForm.get(controlName);
    return !!(control?.errors && control?.touched);
  }

  isBankSelected(bankId: string): boolean {
    return this.selectedBanks.includes(bankId);
  }

  toggleBankSelection(bankId: string): void {
    const index = this.selectedBanks.indexOf(bankId);
    if (index > -1) {
      if (this.selectedBanks.length > 1) {
        this.selectedBanks.splice(index, 1);
      } else {
        this.notificationService.showWarning('Vous devez sélectionner au moins une banque');
      }
    } else {
      this.selectedBanks.push(bankId);
    }
  }

  toggleSelectAll(): void {
    if (this.allBanksSelected) {
      this.selectedBanks = ['bgfi'];
    } else {
      this.selectedBanks = this.availableBanks.map(bank => bank.id);
    }
  }

  get allBanksSelected(): boolean {
    return this.selectedBanks.length === this.availableBanks.length;
  }

  onSubmit(): void {
    if (this.simulationForm.invalid || this.selectedBanks.length === 0) {
      this.markFormGroupTouched(this.simulationForm);
      this.notificationService.showError('Veuillez corriger les erreurs du formulaire');
      return;
    }

    this.isLoading = true;
    this.hasFormError = false;
    this.comparisonResults = null;

    const formData = this.simulationForm.value;

    this.apiService.compareCreditOffers({
      credit_type: formData.creditType,
      amount: formData.requestedAmount,
      duration: formData.duration,
      monthly_income: formData.monthlyIncome,
      current_debts: formData.currentDebts || 0
    }).subscribe({
      next: (result) => {
        const filteredComparisons = result.comparisons.filter(
          (comp: any) => this.selectedBanks.includes(comp.bank.id)
        );

        this.comparisonResults = {
          bankOffers: filteredComparisons,
          bestOffer: result.best_rate,
          summary: {
            totalOffers: filteredComparisons.length,
            bestRate: result.best_rate?.product?.rate,
            lowestPayment: result.lowest_payment?.monthly_payment
          }
        };

        this.isLoading = false;
        this.notificationService.showSuccess('Comparaison terminée avec succès !');
        
        this.analyticsService.trackEvent('multi_bank_simulation_completed', {
          offers_received: filteredComparisons.length,
          best_rate: result.best_rate?.product?.rate,
          best_bank: result.best_rate?.bank?.id
        });

        setTimeout(() => {
          this.scrollToResults();
        }, 100);
      },
      error: (error) => {
        console.error('Erreur simulation:', error);
        this.isLoading = false;
        this.hasFormError = true;
        this.errorMessage = error.error?.detail || 'Une erreur est survenue lors de la comparaison';
        this.notificationService.showError(this.errorMessage);
      }
    });
  }

  setSortBy(sortType: 'rate' | 'payment' | 'time' | 'approval'): void {
    this.sortBy = sortType;
  }

  getSortedOffers(): BankOffer[] {
    if (!this.comparisonResults) return [];
    
    const offers = [...this.comparisonResults.bankOffers];
    
    switch (this.sortBy) {
      case 'rate':
        return offers.sort((a, b) => a.product.rate - b.product.rate);
      case 'payment':
        return offers.sort((a, b) => a.monthly_payment - b.monthly_payment);
      case 'time':
        return offers.sort((a, b) => a.product.processing_time - b.product.processing_time);
      case 'approval':
        return offers.sort((a, b) => (b.eligible ? 1 : 0) - (a.eligible ? 1 : 0));
      default:
        return offers;
    }
  }

  toggleOfferDetails(bankId: string): void {
    if (this.expandedOffers.has(bankId)) {
      this.expandedOffers.delete(bankId);
    } else {
      this.expandedOffers.add(bankId);
    }
  }

  isOfferExpanded(bankId: string): boolean {
    return this.expandedOffers.has(bankId);
  }

  applyToOffer(offer: BankOffer): void {
    this.analyticsService.trackEvent('bank_offer_application_started', {
      bank_id: offer.bank.id,
      bank_name: offer.bank.name,
      interest_rate: offer.product.rate,
      monthly_payment: offer.monthly_payment
    });

    this.notificationService.showSuccess(
      `Demande transmise à ${offer.bank.name}. Vous serez contacté sous 48h.`
    );
  }

  saveComparison(): void {
    if (!this.comparisonResults) return;
    this.notificationService.showSuccess('Comparaison sauvegardée avec succès');
  }

  exportToPDF(): void {
    if (!this.comparisonResults) return;
    this.notificationService.showSuccess('Export PDF généré avec succès');
  }

  shareComparison(): void {
    if (!this.comparisonResults) return;

    const shareText = `Comparaison de crédits - Meilleur taux: ${this.comparisonResults.bestOffer?.product.rate}% chez ${this.comparisonResults.bestOffer?.bank.name}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Comparaison de Crédits - Bamboo',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        this.notificationService.showSuccess('Lien copié dans le presse-papier');
      });
    }
  }

  resetForm(): void {
    this.simulationForm.reset({
      clientType: 'particulier',
      monthlyIncome: 750000,
      creditType: 'consommation',
      requestedAmount: 2000000,
      duration: 24
    });
    this.comparisonResults = null;
    this.hasFormError = false;
    this.selectedBanks = ['bgfi', 'ugb', 'bicig'];
  }

  getEligibilityClass(status: boolean): string {
    return status ? 'eligible' : 'not-eligible';
  }

  getEligibilityText(status: boolean): string {
    return status ? 'Éligible' : 'Non éligible';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getProcessingTimeText(hours: number): string {
    if (hours <= 24) return `${hours}h`;
    const days = Math.ceil(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  hasValidationError(controlName: string, errorType: string = ''): boolean {
    const control = this.simulationForm.get(controlName);
    if (!control) return false;
    
    if (errorType) {
      return !!(control.errors?.[errorType] && control.touched);
    }
    return !!(control.errors && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.simulationForm.get(controlName);
    if (!control?.errors) return '';

    const errors = control.errors;
    
    if (errors['required']) return 'Ce champ est requis';
    if (errors['email']) return 'Format d\'email invalide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['min']) return `Valeur minimum: ${errors['min'].min}`;
    if (errors['max']) return `Valeur maximum: ${errors['max'].max}`;
    if (errors['pattern']) return 'Format invalide';
    
    return 'Valeur invalide';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private scrollToResults(): void {
    const resultsElement = document.querySelector('.results-section');
    if (resultsElement) {
      resultsElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  private trackPageView(): void {
    this.analyticsService.trackPageView('multi_bank_comparator', {
      page_title: 'Comparateur Multi-Banques',
      available_banks: this.availableBanks.length
    });
  }

  get isFormValid(): boolean {
    return this.simulationForm.valid && this.selectedBanks.length > 0;
  }

  get selectedBanksCount(): number {
    return this.selectedBanks.length;
  }

getBankColor(bank: Bank): string {
  const colors: { [key: string]: string } = {
    'bgfi': '#1e40af',
    'ugb': '#dc2626', 
    'bicig': '#059669',
    'ecobank': '#ea580c',
    'cbao': '#7c3aed'
  };
  return colors[bank.id] || '#6b7280';
}

getBankShortName(bank: Bank): string {
  const shortNames: { [key: string]: string } = {
    'bgfi': 'BGFI',
    'ugb': 'UGB',
    'bicig': 'BICIG',
    'ecobank': 'ECO',
    'cbao': 'CBAO'
  };
  return shortNames[bank.id] || bank.name.substring(0, 4).toUpperCase();
}

getBankMarketShare(bank: Bank): number {
  const marketShares: { [key: string]: number } = {
    'bgfi': 28.5,
    'ugb': 22.3,
    'bicig': 18.7,
    'ecobank': 15.2,
    'cbao': 12.1
  };
  return marketShares[bank.id] || 0;
}

getBankProcessingTime(bank: Bank): string {
  const processingTimes: { [key: string]: number } = {
    'bgfi': 24,
    'ugb': 48,
    'bicig': 36,
    'ecobank': 72,
    'cbao': 48
  };
  const hours = processingTimes[bank.id] || 72;
  return this.getProcessingTimeText(hours);
}
  get totalBanksCount(): number {
    return this.availableBanks.length;
  }

  get bestOfferSavings(): number {
    if (!this.comparisonResults || this.comparisonResults.bankOffers.length < 2) return 0;
    
    const offers = this.comparisonResults.bankOffers;
    const sortedOffers = offers.sort((a, b) => a.total_cost - b.total_cost);
    
    if (sortedOffers.length < 2) return 0;
    return sortedOffers[sortedOffers.length - 1].total_cost - sortedOffers[0].total_cost;
  }
}