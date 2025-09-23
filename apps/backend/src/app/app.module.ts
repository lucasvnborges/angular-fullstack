import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [MessagingModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
