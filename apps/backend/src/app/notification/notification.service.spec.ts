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

  describe('setStatus', () => {
    it('should set status for a message ID', () => {
      const mensagemId = 'test-id-123';
      const status: NotificationStatus = 'PROCESSADO_SUCESSO';

      service.setStatus(mensagemId, status);

      const result = service.getStatus(mensagemId);
      expect(result).toBe(status);
    });
  });

  describe('getStatus', () => {
    it('should return undefined for non-existent message ID', () => {
      const result = service.getStatus('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should return status for existing message ID', () => {
      const mensagemId = 'test-id-456';
      const status: NotificationStatus = 'AGUARDANDO_PROCESSAMENTO';

      service.setStatus(mensagemId, status);
      const result = service.getStatus(mensagemId);

      expect(result).toBe(status);
    });
  });

  describe('getAllStatuses', () => {
    it('should return all statuses', () => {
      const status1: NotificationStatus = 'PROCESSADO_SUCESSO';
      const status2: NotificationStatus = 'FALHA_PROCESSAMENTO';

      service.setStatus('id1', status1);
      service.setStatus('id2', status2);

      const allStatuses = service.getAllStatuses();

      expect(allStatuses.size).toBe(2);
      expect(allStatuses.get('id1')).toBe(status1);
      expect(allStatuses.get('id2')).toBe(status2);
    });
  });

  describe('clearStatus', () => {
    it('should clear status for a message ID', () => {
      const mensagemId = 'test-id-789';
      const status: NotificationStatus = 'FALHA_PROCESSAMENTO';

      service.setStatus(mensagemId, status);
      expect(service.getStatus(mensagemId)).toBe(status);

      service.clearStatus(mensagemId);
      expect(service.getStatus(mensagemId)).toBeUndefined();
    });
  });
});
