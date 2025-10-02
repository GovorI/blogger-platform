import { CommandHandler } from '@nestjs/cqrs';
import { RegistrationInputDto } from '../../api/input-dto/registration.input-dto';
import {
  TooManyRequestsException,
  ValidationException,
} from '../../../../core/domain/domain.exception';
import { Extension } from '../../../../core/exceptions/domain-exceptions';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { RateLimiterService } from '../../../../core/services/rate-limiter.service';
import { RateLimiterConfig } from '../../config/rate-limiter.config';
import { CryptoService } from '../crypto-service';
import { User, UserModelType } from '../../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { UsersConfig } from '../../config/users.config';
import { EmailService } from '../../../notifications/email.service';

export class RegistrationCommand {
  constructor(
    public dto: RegistrationInputDto,
    public ip: string | undefined,
  ) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase {
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimiter: RateLimiterService,
    private readonly cryptoService: CryptoService,
    private readonly rateLimiterConfig: RateLimiterConfig,
    private readonly usersConfig: UsersConfig,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: RegistrationCommand) {
    const key = `registration:${command.ip ?? 'unknown'}`;
    const limited = this.rateLimiter.isLimited(
      key,
      this.rateLimiterConfig.max,
      this.rateLimiterConfig.windowMs,
    );
    if (limited) {
      throw new TooManyRequestsException();
    }
    const [existingUserByLogin, existingUserByEmail] = await Promise.all([
      this.usersRepository.getUserByLogin(command.dto.login),
      this.usersRepository.getUserByEmail(command.dto.email),
    ]);

    const extensions: Extension[] = [];
    if (existingUserByLogin) {
      extensions.push(new Extension('Login already exists', 'login'));
    }
    if (existingUserByEmail) {
      extensions.push(new Extension('Email already exists', 'email'));
    }
    if (extensions.length) {
      throw new ValidationException('Validation failed', extensions);
    }

    const passwordHash = await this.cryptoService.createPassHash(
      command.dto.password,
    );

    const confirmCode = randomUUID();
    const expirationCode = new Date(Date.now() + 60000);

    const newUser = new this.UserModel({
      login: command.dto.login,
      email: command.dto.email,
      passwordHash,
      createdAt: new Date(),
      isEmailConfirmed: this.usersConfig.isAuthomaticallyConfirmed,
      deletedAt: null,
      confirmCode,
      expirationCode,
    });

    await this.usersRepository.save(newUser);

    // Only send confirmation email if manual confirmation is required
    if (!this.usersConfig.isAuthomaticallyConfirmed) {
      this.emailService
        .sendConfirmationEmail(command.dto.email, confirmCode)
        .catch((error) => {
          console.error('Failed to send confirmation email:', error);
        });
    }
  }
}
