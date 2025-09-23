/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  NotificationMessage,
  StatusUpdate,
} from '../interfaces/notification.interface';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;
  private readonly notificationQueueName = 'fila.notificacao.entrada.terra';
  private readonly statusQueueName = 'fila.notificacao.status.terra';

  async onModuleInit() {
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Dynamic import to avoid TypeScript issues
      const amqp = await import('amqplib');

      // Connect to RabbitMQ
      const rabbitmqUrl =
        process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
      console.log('Connecting to RabbitMQ:', rabbitmqUrl);

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Create notification queues
      await this.channel.assertQueue(this.notificationQueueName, {
        durable: true,
      });
      await this.channel.assertQueue(this.statusQueueName, { durable: true });

      console.log('Connected to RabbitMQ successfully');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      // Retry connection after 5 seconds
      setTimeout(() => this.initializeConnection(), 5000);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }

  async publishNotification(
    notification: Omit<NotificationMessage, 'timestamp'>
  ): Promise<boolean> {
    try {
      if (!this.channel) {
        console.log('Channel not initialized, attempting to reconnect...');
        await this.initializeConnection();

        if (!this.channel) {
          throw new Error('Channel not initialized after retry');
        }
      }

      const message: NotificationMessage = {
        mensagemId: notification.mensagemId,
        conteudoMensagem: notification.conteudoMensagem,
        timestamp: new Date().toISOString(),
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const sent = this.channel.sendToQueue(
        this.notificationQueueName,
        messageBuffer,
        {
          persistent: true,
        }
      );

      console.log(`Notification published: ${notification.mensagemId}`);
      return sent;
    } catch (error) {
      console.error('Error publishing notification:', error);
      return false;
    }
  }

  async publishStatusUpdate(
    mensagemId: string,
    status: StatusUpdate['status']
  ): Promise<boolean> {
    try {
      if (!this.channel) {
        console.log('Channel not initialized, attempting to reconnect...');
        await this.initializeConnection();

        if (!this.channel) {
          throw new Error('Channel not initialized after retry');
        }
      }

      const statusUpdate: StatusUpdate = {
        mensagemId,
        status,
        timestamp: new Date().toISOString(),
      };

      const messageBuffer = Buffer.from(JSON.stringify(statusUpdate));

      const sent = this.channel.sendToQueue(
        this.statusQueueName,
        messageBuffer,
        {
          persistent: true,
        }
      );

      console.log(`Status update published: ${mensagemId} - ${status}`);
      return sent;
    } catch (error) {
      console.error('Error publishing status update:', error);
      return false;
    }
  }

  getChannel(): any {
    return this.channel;
  }

  getNotificationQueueName(): string {
    return this.notificationQueueName;
  }
}
