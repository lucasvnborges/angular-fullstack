import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationItem, NotificationStatus } from './services/notification.service';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationService);

  // Signals para estado reativo
  readonly title = signal('Sistema de Notificações - RabbitMQ');
  readonly message = signal('');
  readonly loading = this.notificationService.loading;
  readonly notifications = this.notificationService.notifications;

  // Computed signals usando o serviço
  readonly hasNotifications = this.notificationService.hasNotifications;
  readonly pendingNotifications = this.notificationService.pendingNotifications;

  ngOnInit(): void {
    // Carregar notificações do cache do backend
    this.notificationService.loadAllNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('Notifications loaded from backend cache');
          // Iniciar polling após carregar o cache
          this.startPolling();
        },
        error: (error) => {
          console.error('Failed to load notifications from cache:', error);
          // Iniciar polling mesmo se falhar ao carregar o cache
          this.startPolling();
        }
      });
  }

  async sendNotification(): Promise<void> {
    const messageValue = this.message().trim();
    if (!messageValue) return;

    this.notificationService.sendNotification(messageValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Notification sent successfully:', response);
          this.message.set('');
        },
        error: (error) => {
          console.error('Failed to send notification:', error);
          this.showErrorMessage('Erro ao enviar notificação. Tente novamente.');
        }
      });
  }

  private startPolling(): void {
    this.notificationService.startPolling()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Polling executado com sucesso
        },
        error: (error) => {
          console.error('Polling error:', error);
        }
      });
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
