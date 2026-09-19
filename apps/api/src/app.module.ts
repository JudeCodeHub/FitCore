import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { MailerModule } from './mailer/mailer.module.js';
import { PlansModule } from './plans/plans.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, MailerModule, AuthModule, PlansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
