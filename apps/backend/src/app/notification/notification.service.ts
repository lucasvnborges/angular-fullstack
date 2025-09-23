import { Injectable } from '@nestjs/common';
import { NotificationStatus, CachedNotification } from '../interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private notificationCache: Map<string, CachedNotification> = new Map();

  createNotification(mensagemId: string, conteudoMensagem: string, status: NotificationStatus = 'AGUARDANDO_PROCESSAMENTO'): void {
    const notification: CachedNotification = {
      mensagemId,
      conteudoMensagem,
      status,
      timestamp: new Date()
    };
    this.notificationCache.set(mensagemId, notification);
  }

  updateStatus(mensagemId: string, status: NotificationStatus): void {
    const notification = this.notificationCache.get(mensagemId);
    if (notification) {
      notification.status = status;
      this.notificationCache.set(mensagemId, notification);
    }
  }

  getNotification(mensagemId: string): CachedNotification | undefined {
    return this.notificationCache.get(mensagemId);
  }

  getAllNotifications(): CachedNotification[] {
    return Array.from(this.notificationCache.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getStatus(mensagemId: string): NotificationStatus | undefined {
    const notification = this.notificationCache.get(mensagemId);
    return notification?.status;
  }

  clearNotification(mensagemId: string): void {
    this.notificationCache.delete(mensagemId);
  }

  // Métodos legados para compatibilidade
  setStatus(mensagemId: string, status: NotificationStatus): void {
    this.updateStatus(mensagemId, status);
  }

  getAllStatuses(): Map<string, NotificationStatus> {
    const statusMap = new Map<string, NotificationStatus>();
    this.notificationCache.forEach((notification, id) => {
      statusMap.set(id, notification.status);
    });
    return statusMap;
  }

  clearStatus(mensagemId: string): void {
    this.clearNotification(mensagemId);
  }
}
