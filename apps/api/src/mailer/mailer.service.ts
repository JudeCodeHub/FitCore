import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  sendVerificationEmail(to: string, token: string) {
    const link = `http://localhost:3000/verify-email?token=${token}`;
    this.logger.log(
      `[stub email] Verify your FitCore account, ${to}: ${link}`,
    );
  }

  sendPasswordResetEmail(to: string, token: string) {
    const link = `http://localhost:3000/reset-password?token=${token}`;
    this.logger.log(`[stub email] Reset your FitCore password, ${to}: ${link}`);
  }
}
