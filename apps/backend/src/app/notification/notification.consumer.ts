import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationService } from './notification.service';
import {
  NotificationMessage,
  NotificationStatus,
} from '../interfaces/notification.interface';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly notificationService: NotificationService
  ) {}

  async onModuleInit() {
    // Aguardar um pouco para garantir que o MessagingService esteja inicializado
    setTimeout(() => {
      this.startConsumer();
    }, 3000);
  }

  private async startConsumer() {
    console.log('Starting notification consumer...');
    await this.consumeNotifications();
  }

  private async consumeNotifications(): Promise<void> {
    try {
      // Obter o canal do MessagingService
      const channel = this.messagingService.getChannel();
      if (!channel) {
        console.error('Channel not available for consuming notifications');
        // Tentar novamente após 5 segundos
        setTimeout(() => {
          this.consumeNotifications();
        }, 5000);
        return;
      }

      const queueName = this.messagingService.getNotificationQueueName();

      // Configurar consumidor
      await channel.consume(
        queueName,
        async (msg: import('amqplib').ConsumeMessage | null) => {
          if (msg) {
            try {
              const notification: NotificationMessage = JSON.parse(
                msg.content.toString()
              );
              console.log('Received notification:', notification);

              // Processar notificação
              await this.processNotification(notification);

              // Confirmar processamento
              channel.ack(msg);
            } catch (error) {
              console.error('Error processing notification:', error);
              // Rejeitar mensagem em caso de erro
              channel.nack(msg, false, false);
            }
          }
        }
      );

      console.log(`Consumer started for queue: ${queueName}`);
    } catch (error) {
      console.error('Error setting up consumer:', error);
    }
  }

  private async processNotification(
    notification: NotificationMessage
  ): Promise<void> {
    const { mensagemId } = notification;

    console.log(`Processing notification: ${mensagemId}`);

    // Simular processamento de 1-2 segundos
    const delay = 1000 + Math.random() * 1000;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));

    // Gerar número aleatório de 1 a 10
    const randomNumber = Math.floor(Math.random() * 10) + 1;

    // 20% de chance de falha (números 1 e 2)
    const isSuccess = randomNumber > 2;
    const status: NotificationStatus = isSuccess
      ? 'PROCESSADO_SUCESSO'
      : 'FALHA_PROCESSAMENTO';

    console.log(
      `Processing notification - Random: ${randomNumber}, Status: ${status}`
    );

    // Atualizar status no serviço
    this.notificationService.updateStatus(mensagemId, status);

    // Publicar status na fila de status
    await this.messagingService.publishStatusUpdate(mensagemId, status);

    console.log(`Notification ${mensagemId} processed with status: ${status}`);
  }
}
