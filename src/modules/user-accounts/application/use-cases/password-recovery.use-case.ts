import { CommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { EmailService } from '../../../notifications/email.service';

export class PasswordRecoveryCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: PasswordRecoveryCommand) {
    const user = await this.usersRepository.getUserByEmail(command.email);
    if (!user) {
      return;
    }

    const code = randomUUID();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordRecoveryCode = code;
    user.passwordRecoveryExpiration = expiration;

    await this.usersRepository.save(user);

    await this.emailService.sendPasswordRecoveryEmail(command.email, code);
  }
}
