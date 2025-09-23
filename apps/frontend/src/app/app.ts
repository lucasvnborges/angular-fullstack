import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  interval,
  EMPTY,
  catchError,
  switchMap,
  map,
  finalize,
  tap,
  concatMap,
  from,
  of,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Types com melhor tipagem
type NotificationStatus =
  | 'AGUARDANDO_PROCESSAMENTO'
  | 'PROCESSADO_SUCESSO'
  | 'FALHA_PROCESSAMENTO'
  | 'NOT_FOUND';

interface NotificationRequest {
  readonly mensagemId: string;
  readonly conteudoMensagem: string;
}

interface NotificationResponse {
  readonly mensagemId: string;
  readonly status: NotificationStatus;
  readonly message: string;
}

interface StatusResponse {
  readonly mensagemId: string;
  readonly status: NotificationStatus;
}

interface NotificationItem {
  readonly mensagemId: string;
  readonly conteudoMensagem: string;
  status: NotificationStatus;
  readonly timestamp: Date;
  readonly isProcessing: boolean;
}

// Constantes
const POLLING_INTERVAL_MS = 3000;
const API_ENDPOINTS = {
  SEND_NOTIFICATION: '/api/notificar',
  GET_STATUS: (id: string) => `/api/notificacao/status/${id}`,
} as const;

const STATUS_CONFIG = {
  AGUARDANDO_PROCESSAMENTO: {
    color: '#ffc107',
    text: 'Aguardando Processamento',
  },
  PROCESSADO_SUCESSO: { color: '#28a745', text: 'Processado com Sucesso' },
  FALHA_PROCESSAMENTO: { color: '#dc3545', text: 'Falha no Processamento' },
  NOT_FOUND: { color: '#6c757d', text: 'Não Encontrado' },
} as const;

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  // Dependency Injection moderna
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // Signals para estado reativo
  readonly title = signal('Sistema de Notificações - RabbitMQ');
  readonly message = signal('');
  readonly loading = signal(false);
  readonly notifications = signal<NotificationItem[]>([]);

  // Computed signals
  readonly hasNotifications = computed(() => this.notifications().length > 0);
  readonly pendingNotifications = computed(() =>
    this.notifications().filter((n) => n.status === 'AGUARDANDO_PROCESSAMENTO')
  );

  // Subjects para streams reativas
  private readonly notificationSubject = new BehaviorSubject<
    NotificationItem[]
  >([]);
  readonly notifications$ = this.notificationSubject.asObservable();

  constructor() {
    // Effect para sincronizar signal com subject
    effect(() => {
      this.notificationSubject.next(this.notifications());
    });
  }

  ngOnInit(): void {
    this.startPolling();
  }

  async sendNotification(): Promise<void> {
    const messageValue = this.message().trim();
    if (!messageValue) return;

    this.loading.set(true);

    const notificationRequest: NotificationRequest = {
      mensagemId: uuidv4(),
      conteudoMensagem: messageValue,
    };

    this.http
      .post<NotificationResponse>(
        API_ENDPOINTS.SEND_NOTIFICATION,
        notificationRequest
      )
      .pipe(
        tap((response) => console.log('Notification sent:', response)),
        catchError((error) => {
          console.error('Error sending notification:', error);
          this.showErrorMessage(
            'Erro ao enviar notificação. Verifique o console para mais detalhes.'
          );
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        if (response) {
          this.addNotification({
            mensagemId: response.mensagemId,
            conteudoMensagem: messageValue,
            status: response.status,
            timestamp: new Date(),
            isProcessing: response.status === 'AGUARDANDO_PROCESSAMENTO',
          });

          this.message.set('');
        }
      });
  }

  private startPolling(): void {
    interval(POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => this.updateNotificationStatuses()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private updateNotificationStatuses(): Observable<void> {
    const pendingNotifications = this.pendingNotifications();

    if (pendingNotifications.length === 0) {
      return of(void 0);
    }

    return from(pendingNotifications).pipe(
      concatMap((notification) =>
        this.http
          .get<StatusResponse>(
            API_ENDPOINTS.GET_STATUS(notification.mensagemId)
          )
          .pipe(
            map((response) => ({ notification, response })),
            catchError((error) => {
              console.error(
                `Error updating status for ${notification.mensagemId}:`,
                error
              );
              return EMPTY;
            })
          )
      ),
      tap(({ notification, response }) => {
        if (response && response.status !== notification.status) {
          this.updateNotificationStatus(
            notification.mensagemId,
            response.status
          );
        }
      }),
      map(() => void 0)
    );
  }

  private addNotification(notification: NotificationItem): void {
    this.notifications.update((notifications) => [
      notification,
      ...notifications,
    ]);
  }

  private updateNotificationStatus(
    mensagemId: string,
    newStatus: NotificationStatus
  ): void {
    this.notifications.update((notifications) =>
      notifications.map((notification) =>
        notification.mensagemId === mensagemId
          ? {
              ...notification,
              status: newStatus,
              isProcessing: newStatus === 'AGUARDANDO_PROCESSAMENTO',
            }
          : notification
      )
    );
  }

  private showErrorMessage(message: string): void {
    // Em uma aplicação real, usaria um serviço de toast/snackbar
    alert(message);
  }

  // Métodos de template com memoização
  getStatusColor(status: NotificationStatus): string {
    return STATUS_CONFIG[status]?.color ?? STATUS_CONFIG.NOT_FOUND.color;
  }

  getStatusText(status: NotificationStatus): string {
    return STATUS_CONFIG[status]?.text ?? STATUS_CONFIG.NOT_FOUND.text;
  }

  trackByMessageId = (index: number, notification: NotificationItem): string =>
    notification.mensagemId;

  // Métodos de template para eventos
  onMessageInput(value: string): void {
    this.message.set(value);
  }

  onSendNotification(): void {
    this.sendNotification();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendNotification();
    }
  }
}
