import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@example.com',
      to: email,
      subject: 'confirm registration',
      text: `confirm registration via link https://some.com?code=${code}`,
    });
  }

  async sendPasswordRecoveryEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@example.com',
      to: email,
      subject: 'password recovery',
      text: `recover your password via link https://some.com/recover?code=${code}`,
    });
  }
}
