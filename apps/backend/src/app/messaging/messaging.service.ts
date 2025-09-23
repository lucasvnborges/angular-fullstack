import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;
  private readonly queueName = 'message_queue';

  async onModuleInit() {
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Dynamic import to avoid TypeScript issues
      const amqp = await import('amqplib');
      
      // Connect to RabbitMQ
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
      console.log('Connecting to RabbitMQ:', rabbitmqUrl);
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Create queue
      await this.channel.assertQueue(this.queueName, { durable: true });
      
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

  async publishMessage(message: string): Promise<boolean> {
    try {
      if (!this.channel) {
        console.log('Channel not initialized, attempting to reconnect...');
        await this.initializeConnection();
        
        if (!this.channel) {
          throw new Error('Channel not initialized after retry');
        }
      }

      const messageBuffer = Buffer.from(JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      }));

      const sent = this.channel.sendToQueue(this.queueName, messageBuffer, {
        persistent: true
      });

      console.log(`Message published: ${message}`);
      return sent;
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  async consumeMessages(callback: (message: any) => void): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('Channel not initialized');
      }

      await this.channel.consume(this.queueName, (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          callback(content);
          this.channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error consuming messages:', error);
    }
  }

  async getQueueInfo(): Promise<any> {
    try {
      if (!this.channel) {
        return { error: 'Channel not initialized' };
      }

      const queueInfo = await this.channel.checkQueue(this.queueName);
      return {
        queueName: this.queueName,
        messageCount: queueInfo.messageCount || 0,
        consumerCount: queueInfo.consumerCount || 0
      };
    } catch (error) {
      console.error('Error getting queue info:', error);
      return { 
        queueName: this.queueName,
        messageCount: 0,
        consumerCount: 0,
        error: error.message || 'Unknown error'
      };
    }
  }
}
