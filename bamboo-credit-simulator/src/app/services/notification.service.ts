// src/app/core/services/notification.service.ts (Corrigé)
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable(); // ← PUBLIC maintenant

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  showSuccess(message: string, duration?: number): void {
    this.showNotification('success', message, duration);
  }

  showError(message: string, duration?: number): void {
    this.showNotification('error', message, duration);
  }

  showWarning(message: string, duration?: number): void {
    this.showNotification('warning', message, duration);
  }

  showInfo(message: string, duration?: number): void {
    this.showNotification('info', message, duration);
  }

  private showNotification(type: Notification['type'], message: string, duration?: number): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      duration: duration || 4000
    };
    this.notificationSubject.next(notification);
  }
}