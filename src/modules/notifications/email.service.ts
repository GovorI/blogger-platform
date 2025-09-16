import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { NotificationsConfig } from './notifications.config';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private notificationsConfig: NotificationsConfig,
  ) { }

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      from: this.notificationsConfig.mailFrom,
      to: email,
      subject: 'confirm registration',
      text: `confirm registration via link https://some.com?code=${code}`,
    });
  }

  async sendPasswordRecoveryEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      from: this.notificationsConfig.mailFrom,
      to: email,
      subject: 'password recovery',
      text: `recover your password via link https://some.com/recover?code=${code}`,
    });
  }
}
