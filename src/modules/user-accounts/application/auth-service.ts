import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto-service';
import { JwtService } from './jwt-service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { EmailService } from '../../notifications/email.service';
import { TooManyRequestsException } from '../../../core/domain/domain.exception';
import { RateLimiterService } from '../../../core/services/rate-limiter.service';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UsersConfig } from '../config/users.config';
import { RateLimiterConfig } from '../config/rate-limiter.config';
import { JwtConfig } from '../../jwt/jwt.config';
import { Session, SessionModelType } from '../domain/session.entity';
import { SessionsRepository } from '../infrastructure/sessions.repository';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
    @InjectModel(Session.name)
    private readonly SessionModel: SessionModelType,
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly rateLimiter: RateLimiterService,
    private readonly usersConfig: UsersConfig,
    private readonly rateLimiterConfig: RateLimiterConfig,
    private readonly jwtConfig: JwtConfig,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async validateUser(
    loginOrEmail: string,
    password: string,
    ip: string | undefined,
  ): Promise<UserContextDto | null> {
    const user: UserDocument | null =
      await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      const key = `login:${ip ?? 'unknown'}`;
      const limited = this.rateLimiter.isLimited(
        key,
        this.rateLimiterConfig.max,
        this.rateLimiterConfig.windowMs,
      );
      if (limited) {
        throw new TooManyRequestsException();
      }
      return null;
    }

    if (!this.usersConfig.isAuthomaticallyConfirmed && !user.isEmailConfirmed) {
      return null;
    }

    const isPasswordValid = await this.cryptoService.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const key = `login:${ip ?? 'unknown'}`;
      const limited = this.rateLimiter.isLimited(
        key,
        this.rateLimiterConfig.max,
        this.rateLimiterConfig.windowMs,
      );
      if (limited) {
        throw new TooManyRequestsException();
      }
      return null;
    }
    console.log(user);
    return { id: user._id.toString() };
  }
}
