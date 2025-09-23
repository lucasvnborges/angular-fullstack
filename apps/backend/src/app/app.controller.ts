import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagingService } from './messaging/messaging.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly messagingService: MessagingService
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('messages')
  async sendMessage(@Body() body: { message: string }) {
    const success = await this.messagingService.publishMessage(body.message);
    return { 
      success, 
      message: success ? 'Message sent successfully' : 'Failed to send message' 
    };
  }

  @Get('messages/queue-info')
  async getQueueInfo() {
    return await this.messagingService.getQueueInfo();
  }
}
