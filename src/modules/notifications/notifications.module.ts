import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.mail.ru',
        port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 465,
        secure: (process.env.MAIL_SECURE ?? 'true') === 'true',
        auth: {
          user: process.env.MAIL_USER || '',
          pass: process.env.MAIL_PASS || '',
        },
        tls: {
          rejectUnauthorized:
            (process.env.MAIL_TLS_REJECT_UNAUTHORIZED ?? 'false') === 'true',
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
