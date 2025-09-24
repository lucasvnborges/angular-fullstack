import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationStatus } from '../interfaces/notification.interface';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a new notification', () => {
      const mensagemId = 'test-id-123';
      const conteudoMensagem = 'Test message';
      const status: NotificationStatus = 'PROCESSADO_SUCESSO';

      service.createNotification(mensagemId, conteudoMensagem, status);

      const result = service.getStatus(mensagemId);
      expect(result).toBe(status);
      
      const notification = service.getNotification(mensagemId);
      expect(notification).toBeDefined();
      expect(notification?.conteudoMensagem).toBe(conteudoMensagem);
    });
  });

  describe('updateStatus', () => {
    it('should update status for existing notification', () => {
      const mensagemId = 'test-id-456';
      const conteudoMensagem = 'Test message';
      const initialStatus: NotificationStatus = 'AGUARDANDO_PROCESSAMENTO';
      const newStatus: NotificationStatus = 'PROCESSADO_SUCESSO';

      service.createNotification(mensagemId, conteudoMensagem, initialStatus);
      service.updateStatus(mensagemId, newStatus);

      const result = service.getStatus(mensagemId);
      expect(result).toBe(newStatus);
    });
  });

  describe('getStatus', () => {
    it('should return undefined for non-existent message ID', () => {
      const result = service.getStatus('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should return status for existing message ID', () => {
      const mensagemId = 'test-id-789';
      const conteudoMensagem = 'Test message';
      const status: NotificationStatus = 'AGUARDANDO_PROCESSAMENTO';

      service.createNotification(mensagemId, conteudoMensagem, status);
      const result = service.getStatus(mensagemId);

      expect(result).toBe(status);
    });
  });

  describe('getAllNotifications', () => {
    it('should return all notifications', async () => {
      const status1: NotificationStatus = 'AGUARDANDO_PROCESSAMENTO';
      const status2: NotificationStatus = 'PROCESSADO_SUCESSO';

      service.createNotification('id1', 'Message 1', status1);
      // Delay maior para garantir timestamps diferentes
      await new Promise(resolve => setTimeout(resolve, 50));
      service.createNotification('id2', 'Message 2', status2);

      const allNotifications = service.getAllNotifications();

      expect(allNotifications).toHaveLength(2);
      // As notificações são ordenadas por timestamp (mais recente primeiro)
      // Como criamos id2 depois de id1, id2 deve vir primeiro
      expect(allNotifications[0].mensagemId).toBe('id2');
      expect(allNotifications[0].status).toBe(status2);
      expect(allNotifications[1].mensagemId).toBe('id1');
      expect(allNotifications[1].status).toBe(status1);
    });
  });

  describe('getAllStatuses', () => {
    it('should return all statuses (legacy method)', () => {
      const status1: NotificationStatus = 'PROCESSADO_SUCESSO';
      const status2: NotificationStatus = 'FALHA_PROCESSAMENTO';

      service.createNotification('id1', 'Message 1', status1);
      service.createNotification('id2', 'Message 2', status2);

      const allStatuses = service.getAllStatuses();

      expect(allStatuses.size).toBe(2);
      expect(allStatuses.get('id1')).toBe(status1);
      expect(allStatuses.get('id2')).toBe(status2);
    });
  });

  describe('clearNotification', () => {
    it('should clear notification for a message ID', () => {
      const mensagemId = 'test-id-clear';
      const conteudoMensagem = 'Test message';
      const status: NotificationStatus = 'FALHA_PROCESSAMENTO';

      service.createNotification(mensagemId, conteudoMensagem, status);
      expect(service.getStatus(mensagemId)).toBe(status);

      service.clearNotification(mensagemId);
      expect(service.getStatus(mensagemId)).toBeUndefined();
      expect(service.getNotification(mensagemId)).toBeUndefined();
    });
  });

  describe('clearStatus', () => {
    it('should clear status for a message ID (legacy method)', () => {
      const mensagemId = 'test-id-legacy';
      const conteudoMensagem = 'Test message';
      const status: NotificationStatus = 'FALHA_PROCESSAMENTO';

      service.createNotification(mensagemId, conteudoMensagem, status);
      expect(service.getStatus(mensagemId)).toBe(status);

      service.clearStatus(mensagemId);
      expect(service.getStatus(mensagemId)).toBeUndefined();
    });
  });
});
