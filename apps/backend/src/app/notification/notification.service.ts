import { Injectable } from '@nestjs/common';
import { NotificationStatus } from '../interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private statusMap: Map<string, NotificationStatus> = new Map();

  setStatus(mensagemId: string, status: NotificationStatus): void {
    this.statusMap.set(mensagemId, status);
  }

  getStatus(mensagemId: string): NotificationStatus | undefined {
    return this.statusMap.get(mensagemId);
  }

  getAllStatuses(): Map<string, NotificationStatus> {
    return this.statusMap;
  }

  clearStatus(mensagemId: string): void {
    this.statusMap.delete(mensagemId);
  }
}
