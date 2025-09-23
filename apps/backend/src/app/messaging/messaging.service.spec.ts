import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';

// Mock do amqplib
const mockChannel = {
  sendToQueue: jest.fn().mockReturnValue(true),
  assertQueue: jest.fn().mockResolvedValue({}),
  checkQueue: jest
    .fn()
    .mockResolvedValue({ messageCount: 0, consumerCount: 0 }),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockAmqp = {
  connect: jest.fn().mockResolvedValue(mockConnection),
};

// Mock do import dinâmico
jest.mock('amqplib', () => mockAmqp);

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagingService],
    }).compile();

    service = module.get<MessagingService>(MessagingService);

    // Limpar mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishNotification', () => {
    it('should publish notification to queue successfully', async () => {
      jest.spyOn(service, 'getChannel').mockReturnValue(mockChannel);

      const notification = {
        mensagemId: 'test-id',
        conteudoMensagem: 'Test notification',
      };

      const result = await service.publishNotification(notification);

      expect(result).toBe(true);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'fila.notificacao.entrada.terra',
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('should handle channel not initialized by attempting reconnection', async () => {
      jest.spyOn(service, 'getChannel').mockReturnValue(null);
      // Mock para evitar reconexão real nos testes
      jest
        .spyOn(service, 'initializeConnection' as keyof MessagingService)
        .mockResolvedValue(undefined);

      const notification = {
        mensagemId: 'test-id',
        conteudoMensagem: 'Test notification',
      };

      const result = await service.publishNotification(notification);

      // Como o canal continua null após o mock, deve retornar false
      expect(result).toBe(false);
      expect(service['initializeConnection']).toHaveBeenCalled();
    });
  });

  describe('publishStatusUpdate', () => {
    it('should publish status update to queue successfully', async () => {
      jest.spyOn(service, 'getChannel').mockReturnValue(mockChannel);

      const mensagemId = 'test-id';
      const status = 'PROCESSADO_SUCESSO';

      const result = await service.publishStatusUpdate(mensagemId, status);

      expect(result).toBe(true);
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'fila.notificacao.status.terra',
        expect.any(Buffer),
        { persistent: true }
      );
    });
  });
});
