import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Param,
} from '@nestjs/common';
import { AppService } from './app.service';
import { MessagingService } from './messaging/messaging.service';
import { NotificationService } from './notification/notification.service';
import {
  NotificationRequest,
  NotificationResponse,
  StatusResponse,
  NotificationListResponse,
} from './interfaces/notification.interface';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly messagingService: MessagingService,
    private readonly notificationService: NotificationService
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('notificar')
  async sendNotification(
    @Body() body: NotificationRequest
  ): Promise<NotificationResponse> {
    // Validação básica
    if (!body.conteudoMensagem || body.conteudoMensagem.trim() === '') {
      throw new HttpException(
        'Conteúdo da mensagem não pode ser vazio',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!body.mensagemId || body.mensagemId.trim() === '') {
      throw new HttpException(
        'ID da mensagem é obrigatório',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // Publicar na fila de entrada
      const success = await this.messagingService.publishNotification({
        mensagemId: body.mensagemId,
        conteudoMensagem: body.conteudoMensagem,
      });

      if (success) {
        this.notificationService.createNotification(
          body.mensagemId,
          body.conteudoMensagem,
          'AGUARDANDO_PROCESSAMENTO'
        );

        return {
          mensagemId: body.mensagemId,
          status: 'AGUARDANDO_PROCESSAMENTO',
          message: 'Notificação enviada para processamento',
        };
      } else {
        throw new HttpException(
          'Erro interno do servidor',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro interno do servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('notificacao/status/:mensagemId')
  async getNotificationStatus(
    @Param('mensagemId') mensagemId: string
  ): Promise<StatusResponse> {
    const status = this.notificationService.getStatus(mensagemId);
    return {
      mensagemId: mensagemId,
      status: status || 'NOT_FOUND',
    };
  }

  @Get('notificacoes')
  async getAllNotifications(): Promise<NotificationListResponse> {
    const notifications = this.notificationService.getAllNotifications();
    return {
      notifications,
      total: notifications.length,
    };
  }
}
