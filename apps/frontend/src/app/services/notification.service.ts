import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, EMPTY } from 'rxjs';
import { catchError, retry, timeout, map, tap, switchMap, filter } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Types
export type NotificationStatus =
  | 'AGUARDANDO_PROCESSAMENTO'
  | 'PROCESSADO_SUCESSO'
  | 'FALHA_PROCESSAMENTO'
  | 'NOT_FOUND';

export interface NotificationRequest {
  readonly mensagemId: string;
  readonly conteudoMensagem: string;
}

export interface NotificationResponse {
  readonly mensagemId: string;
  readonly status: NotificationStatus;
  readonly message: string;
}

export interface StatusResponse {
  readonly mensagemId: string;
  readonly status: NotificationStatus;
}

export interface NotificationItem {
  readonly mensagemId: string;
  readonly conteudoMensagem: string;
  status: NotificationStatus;
  readonly timestamp: Date;
  readonly isProcessing: boolean;
}

// Configuration
const API_CONFIG = {
  ENDPOINTS: {
    SEND_NOTIFICATION: '/api/notificar',
    GET_STATUS: (id: string) => `/api/notificacao/status/${id}`,
  },
  TIMEOUTS: {
    REQUEST: 10000, // 10 seconds
    RETRY_DELAY: 1000, // 1 second
  },
  RETRY_COUNT: 3,
} as const;

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  // State management with signals
  private readonly _notifications = signal<NotificationItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasNotifications = computed(() => this.notifications().length > 0);
  readonly pendingNotifications = computed(() =>
    this.notifications().filter((n) => n.status === 'AGUARDANDO_PROCESSAMENTO')
  );
  readonly completedNotifications = computed(() =>
    this.notifications().filter((n) => n.status !== 'AGUARDANDO_PROCESSAMENTO')
  );
  readonly successCount = computed(
    () =>
      this.notifications().filter((n) => n.status === 'PROCESSADO_SUCESSO')
        .length
  );
  readonly failureCount = computed(
    () =>
      this.notifications().filter((n) => n.status === 'FALHA_PROCESSAMENTO')
        .length
  );

  /**
   * Sends a notification to the backend
   * @param message The notification message content
   * @returns Observable with the notification response
   */
  sendNotification(message: string): Observable<NotificationResponse> {
    if (!message?.trim()) {
      return throwError(() => new Error('Message cannot be empty'));
    }

    this._loading.set(true);
    this._error.set(null);

    const request: NotificationRequest = {
      mensagemId: uuidv4(),
      conteudoMensagem: message.trim(),
    };

    return this.http
      .post<NotificationResponse>(
        API_CONFIG.ENDPOINTS.SEND_NOTIFICATION,
        request
      )
      .pipe(
        timeout(API_CONFIG.TIMEOUTS.REQUEST),
        retry({
          count: API_CONFIG.RETRY_COUNT,
          delay: (error, retryCount) => {
            console.warn(
              `Retry attempt ${retryCount} for notification send:`,
              error
            );
            return timer(API_CONFIG.TIMEOUTS.RETRY_DELAY * retryCount);
          },
        }),
        tap((response) => {
          console.log('Notification sent successfully:', response);
          this.addNotification({
            mensagemId: response.mensagemId,
            conteudoMensagem: message.trim(),
            status: response.status,
            timestamp: new Date(),
            isProcessing: response.status === 'AGUARDANDO_PROCESSAMENTO',
          });
        }),
        catchError((error) => {
          const errorMessage = this.getErrorMessage(error);
          console.error('Failed to send notification:', errorMessage);
          this._error.set(errorMessage);
          return throwError(() => error);
        }),
        tap({
          finalize: () => this._loading.set(false),
        })
      );
  }

  /**
   * Gets the status of a specific notification
   * @param messageId The notification message ID
   * @returns Observable with the status response
   */
  getNotificationStatus(messageId: string): Observable<StatusResponse> {
    if (!messageId?.trim()) {
      return throwError(() => new Error('Message ID cannot be empty'));
    }

    return this.http
      .get<StatusResponse>(API_CONFIG.ENDPOINTS.GET_STATUS(messageId))
      .pipe(
        timeout(API_CONFIG.TIMEOUTS.REQUEST),
        retry({
          count: API_CONFIG.RETRY_COUNT,
          delay: API_CONFIG.TIMEOUTS.RETRY_DELAY,
        }),
        catchError((error) => {
          console.error(`Failed to get status for ${messageId}:`, error);
          return EMPTY; // Don't propagate status check errors
        })
      );
  }

  /**
   * Updates the status of multiple notifications
   * @param messageIds Array of message IDs to update
   * @returns Observable that completes when all updates are done
   */
  updateNotificationStatuses(messageIds: string[]): Observable<void> {
    if (!messageIds?.length) {
      return EMPTY;
    }

    const statusUpdates = messageIds.map((id) =>
      this.getNotificationStatus(id).pipe(
        tap((response) => {
          if (response) {
            this.updateNotificationStatus(id, response.status);
          }
        }),
        catchError(() => EMPTY) // Continue with other updates if one fails
      )
    );

    return timer(0).pipe(
      switchMap(() => Promise.all(statusUpdates.map((obs) => obs.toPromise()))),
      map(() => void 0)
    );
  }

  /**
   * Starts automatic polling for pending notifications
   * @param intervalMs Polling interval in milliseconds
   * @returns Observable that emits on each polling cycle
   */
  startPolling(intervalMs = 3000): Observable<void> {
    return timer(0, intervalMs).pipe(
      filter(() => this.pendingNotifications().length > 0),
      switchMap(() => {
        const pendingIds = this.pendingNotifications().map((n) => n.mensagemId);
        return this.updateNotificationStatuses(pendingIds);
      }),
      catchError((error) => {
        console.error('Polling error:', error);
        return EMPTY; // Continue polling even if an update fails
      })
    );
  }

  /**
   * Clears all notifications
   */
  clearNotifications(): void {
    this._notifications.set([]);
    this._error.set(null);
  }

  /**
   * Removes a specific notification
   * @param messageId The notification message ID to remove
   */
  removeNotification(messageId: string): void {
    this._notifications.update((notifications) =>
      notifications.filter((n) => n.mensagemId !== messageId)
    );
  }

  /**
   * Clears any error state
   */
  clearError(): void {
    this._error.set(null);
  }

  // Private methods
  private addNotification(notification: NotificationItem): void {
    this._notifications.update((notifications) => [
      notification,
      ...notifications,
    ]);
  }

  private updateNotificationStatus(
    messageId: string,
    newStatus: NotificationStatus
  ): void {
    this._notifications.update((notifications) =>
      notifications.map((notification) =>
        notification.mensagemId === messageId
          ? {
              ...notification,
              status: newStatus,
              isProcessing: newStatus === 'AGUARDANDO_PROCESSAMENTO',
            }
          : notification
      )
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          return 'Erro de conexão. Verifique sua internet.';
        case 400:
          return 'Dados inválidos enviados.';
        case 500:
          return 'Erro interno do servidor.';
        case 503:
          return 'Serviço temporariamente indisponível.';
        default:
          return `Erro HTTP ${error.status}: ${error.message}`;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Erro desconhecido';
  }
}
