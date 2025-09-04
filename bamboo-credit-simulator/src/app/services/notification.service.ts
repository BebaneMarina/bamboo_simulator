// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // en millisecondes, 0 = permanent
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      duration: notification.duration ?? 5000 // 5 secondes par défaut
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto-suppression après la durée spécifiée
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(newNotification.id);
      }, newNotification.duration);
    }
  }

  showSuccess(message: string, duration?: number, action?: { label: string; callback: () => void }): void {
    this.addNotification({
      type: 'success',
      message,
      duration,
      action
    });
  }

  showError(message: string, duration?: number, action?: { label: string; callback: () => void }): void {
    this.addNotification({
      type: 'error',
      message,
      duration: duration ?? 8000, // Erreurs restent plus longtemps
      action
    });
  }

  showWarning(message: string, duration?: number, action?: { label: string; callback: () => void }): void {
    this.addNotification({
      type: 'warning',
      message,
      duration,
      action
    });
  }

  showInfo(message: string, duration?: number, action?: { label: string; callback: () => void }): void {
    this.addNotification({
      type: 'info',
      message,
      duration,
      action
    });
  }

  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  dismissAll(): void {
    this.notificationsSubject.next([]);
  }

  // Méthodes utilitaires pour des cas d'usage courants
  showConnectionSuccess(username?: string): void {
    const message = username 
      ? `Bienvenue ${username} ! Vous êtes maintenant connecté.`
      : 'Connexion réussie !';
    this.showSuccess(message);
  }

  showConnectionError(error?: string): void {
    const message = error || 'Erreur de connexion. Vérifiez vos identifiants.';
    this.showError(message);
  }

  showRegistrationSuccess(): void {
    this.showSuccess('Compte créé avec succès ! Vérifiez votre email pour activer votre compte.');
  }

  showSimulationSaved(): void {
    this.showSuccess('Simulation sauvegardée avec succès !', 3000, {
      label: 'Voir mes simulations',
      callback: () => {
        // Navigation vers les simulations - à implémenter selon votre router
        window.location.href = '/simulations';
      }
    });
  }

  showApplicationSubmitted(): void {
    this.showSuccess('Votre demande a été envoyée avec succès ! Vous recevrez une confirmation par email.', 6000);
  }

  showNetworkError(): void {
    this.showError('Erreur de connexion. Vérifiez votre connexion internet.', 0, {
      label: 'Réessayer',
      callback: () => {
        window.location.reload();
      }
    });
  }
}