import { Injectable } from '@nestjs/common';
import { RegistrationInputDto } from '../api/input-dto/registration.input-dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto-service';
import { JwtService } from './jwt-service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { EmailService } from 'src/modules/notifications/email.service';
import { ValidationException } from 'src/core/domain/domain.exception';
import { Extension } from 'src/core/exceptions/domain-exceptions';
import { randomUUID } from 'crypto';
import { RateLimiterService } from './rate-limiter.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UnauthorizedException as DomainUnauthorizedException } from 'src/core/domain/domain.exception';
import { PasswordRecoveryInputDto } from '../api/input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from '../api/input-dto/new-password.input-dto';
import { EmailResendingInputDto } from '../api/input-dto/email-resending.input-dto';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }
    console.log(user);
    return { id: user.id.toString() };
  }

  async login(userId: string) {
    const accessToken = this.jwtService.createJwtToken(
      userId,
      'deviceId',
      '1h',
    );

    return {
      accessToken,
    };
  }

  // async login(dto: LoginInputDto) {
  //     const user = await this.usersRepository.findByLoginOrEmail(dto.loginOrEmail);
  //     if (!user) {
  //         // throw new Error('Invalid credentials');
  //         throw new UserNotFoundException()
  //     }

  //     const passwordMatch = await this.cryptoService.comparePasswords(
  //         dto.password,
  //         user.passwordHash
  //     );
  //     if (!passwordMatch) {
  //         // throw new Error('Invalid credentials');
  //         throw new UnauthorizedException()
  //     }
  //     const accessToken = this.jwtService.createJwtToken(user.id, 'deviceId', '5m')
  //     return {
  //         accessToken
  //     };
  // }

  async passwordRecovery(
    dto: PasswordRecoveryInputDto,
    ip: string | undefined,
  ) {
    const key = `password-recovery:${ip ?? 'unknown'}`;
    const max = Number.isFinite(parseInt(process.env.RATE_LIMIT_MAX ?? '', 10)) ? parseInt(process.env.RATE_LIMIT_MAX as string, 10) : 5;
    const windowMs = Number.isFinite(parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '', 10)) ? parseInt(process.env.RATE_LIMIT_WINDOW_MS as string, 10) : 10_000;
    const limited = this.rateLimiter.isLimited(key, max, windowMs);
    if (limited) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.usersRepository.getUserByEmail(dto.email);
    if (!user) {
      // Return silently to prevent email enumeration
      return;
    }

    const code = randomUUID();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordRecoveryCode = code;
    user.passwordRecoveryExpiration = expiration;

    await this.usersRepository.save(user);

    await this.emailService.sendPasswordRecoveryEmail(dto.email, code);
  }

  async newPassword(dto: NewPasswordInputDto) {
    const user = await this.usersRepository.findUserByPasswordRecoveryCode(
      dto.recoveryCode,
    );
    if (!user) {
      return;
    }
    if (!user.passwordRecoveryExpiration) return false;

    const expiresAt = new Date(user.passwordRecoveryExpiration).getTime();
    if (Number.isNaN(expiresAt)) return false;

    const passwordHash: string = await this.cryptoService.createPassHash(
      dto.newPassword,
    );
    user.passwordRecoveryCode = null;
    user.passwordRecoveryExpiration = null;
    user.passwordHash = passwordHash;
    await this.usersRepository.save(user);
  }

  async registrationConfirmation(dto: { code: string }) {
    const user = await this.usersRepository.findUserByConfirmationCode(
      dto.code,
    );
    if (!user) {
      return; // DTO validator should catch, double-checking here
    }

    user.isEmailConfirmed = true;
    user.confirmCode = null;
    user.expirationCode = null;

    await this.usersRepository.save(user);
  }

  async registration(dto: RegistrationInputDto) {
    const [existingUserByLogin, existingUserByEmail] = await Promise.all([
      this.usersRepository.getUserByLogin(dto.login),
      this.usersRepository.getUserByEmail(dto.email),
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

    const passwordHash = await this.cryptoService.createPassHash(dto.password);

    const confirmCode = randomUUID();
    const expirationCode = new Date(Date.now() + 60000);

    const newUser = new this.UserModel({
      login: dto.login,
      email: dto.email,
      passwordHash,
      createdAt: new Date(),
      isEmailConfirmed: false,
      deletedAt: null,
      confirmCode,
      expirationCode,
    });

    await this.usersRepository.save(newUser);
    this.emailService.sendConfirmationEmail(dto.email, confirmCode);
  }

  async registrationEmailResending(dto: EmailResendingInputDto) {
    const user = await this.usersRepository.getUserByEmail(dto.email);
    if (!user) {
      throw new ValidationException('Validation failed', [
        new Extension('User with this email does not exist', 'email'),
      ]);
    }
    if (user.isEmailConfirmed) {
      throw new ValidationException('Validation failed', [
        new Extension('Email already confirmed', 'email'),
      ]);
    }
    const confirmCode = randomUUID();
    const expirationCode = new Date(Date.now() + 60000);
    user.confirmCode = confirmCode;
    user.expirationCode = expirationCode;
    await this.usersRepository.save(user);
    this.emailService.sendConfirmationEmail(dto.email, confirmCode);
  }

  async getMe(
    accessToken: string,
  ): Promise<{ email: string; login: string; userId: string }> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyToken(accessToken);
    } catch {
      throw new DomainUnauthorizedException();
    }

    const userId: string | undefined = payload?.userId ?? payload?.sub;
    if (!userId) {
      throw new DomainUnauthorizedException();
    }

    return await this.usersQueryRepository.getMe(userId);
  }
}
