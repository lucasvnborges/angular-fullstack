import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagingService } from './messaging/messaging.service';
import { NotificationService } from './notification/notification.service';

describe('AppController', () => {
  let controller: AppController;
  let messagingService: MessagingService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getData: jest.fn().mockReturnValue({ message: 'Hello World!' }),
          },
        },
        {
          provide: MessagingService,
          useValue: {
            publishNotification: jest.fn(),
            publishStatusUpdate: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            setStatus: jest.fn(),
            getStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    messagingService = module.get<MessagingService>(MessagingService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const notificationData = {
        mensagemId: 'test-id-123',
        conteudoMensagem: 'Test notification content',
      };

      jest
        .spyOn(messagingService, 'publishNotification')
        .mockResolvedValue(true);
      jest
        .spyOn(notificationService, 'setStatus')
        .mockImplementation(() => undefined);

      const result = await controller.sendNotification(notificationData);

      expect(result).toEqual({
        mensagemId: 'test-id-123',
        status: 'AGUARDANDO_PROCESSAMENTO',
        message: 'Notificação enviada para processamento',
      });
      expect(messagingService.publishNotification).toHaveBeenCalledWith(
        notificationData
      );
      expect(notificationService.setStatus).toHaveBeenCalledWith(
        'test-id-123',
        'AGUARDANDO_PROCESSAMENTO'
      );
    });

    it('should throw HttpException for empty content', async () => {
      const notificationData = {
        mensagemId: 'test-id-123',
        conteudoMensagem: '',
      };

      await expect(
        controller.sendNotification(notificationData)
      ).rejects.toThrow(
        new HttpException(
          'Conteúdo da mensagem não pode ser vazio',
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should throw HttpException for empty message ID', async () => {
      const notificationData = {
        mensagemId: '',
        conteudoMensagem: 'Test content',
      };

      await expect(
        controller.sendNotification(notificationData)
      ).rejects.toThrow(
        new HttpException(
          'ID da mensagem é obrigatório',
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should throw HttpException when publishing fails', async () => {
      const notificationData = {
        mensagemId: 'test-id-123',
        conteudoMensagem: 'Test notification content',
      };

      jest
        .spyOn(messagingService, 'publishNotification')
        .mockResolvedValue(false);

      await expect(
        controller.sendNotification(notificationData)
      ).rejects.toThrow(
        new HttpException(
          'Erro interno do servidor',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
    });
  });

  describe('getNotificationStatus', () => {
    it('should return notification status', async () => {
      const mensagemId = 'test-id-123';
      const status = 'PROCESSADO_SUCESSO';

      jest.spyOn(notificationService, 'getStatus').mockReturnValue(status);

      const result = await controller.getNotificationStatus(mensagemId);

      expect(result).toEqual({
        mensagemId: 'test-id-123',
        status: 'PROCESSADO_SUCESSO',
      });
    });

    it('should return NOT_FOUND for non-existent message', async () => {
      const mensagemId = 'non-existent-id';

      jest.spyOn(notificationService, 'getStatus').mockReturnValue(undefined);

      const result = await controller.getNotificationStatus(mensagemId);

      expect(result).toEqual({
        mensagemId: 'non-existent-id',
        status: 'NOT_FOUND',
      });
    });
  });
});
