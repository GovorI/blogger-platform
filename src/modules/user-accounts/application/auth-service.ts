import { Injectable } from '@nestjs/common';
import { RegistrationInputDto } from '../api/input-dto/registration.input-dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto-service';
import { JwtService } from './jwt-service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { EmailService } from '../../notifications/email.service';
import { TooManyRequestsException, ValidationException } from '../../../core/domain/domain.exception';
import { Extension } from '../../../core/exceptions/domain-exceptions';
import { randomUUID } from 'crypto';
import { RateLimiterService } from '../../../core/services/rate-limiter.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UnauthorizedException as DomainUnauthorizedException } from '../../../core/domain/domain.exception';
import { PasswordRecoveryInputDto } from '../api/input-dto/password-recovery.input-dto';
import { NewPasswordInputDto } from '../api/input-dto/new-password.input-dto';
import { EmailResendingInputDto } from '../api/input-dto/email-resending.input-dto';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UsersConfig } from '../config/users.config';
import { RateLimiterConfig } from '../config/rate-limiter.config';
import { JwtConfig } from '../../jwt/jwt.config';

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
    private readonly usersConfig: UsersConfig,
    private readonly rateLimiterConfig: RateLimiterConfig,
    private readonly jwtConfig: JwtConfig,
  ) { }

  async validateUser(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      return null;
    }

    // Check if email is confirmed (unless auto-confirmation is enabled)
    if (!this.usersConfig.isAuthomaticallyConfirmed && !user.isEmailConfirmed) {
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

  async login(userId: string,) {
    const accessToken = this.jwtService.createJwtToken(
      userId,
      'deviceId',
      this.jwtConfig.accessTokenExpiresIn,
      false
    );

    const refreshToken = this.jwtService.createJwtToken(
      userId,
      'deviceId',
      this.jwtConfig.refreshTokenExpiresIn,
      true
    );

    // Extract refresh token ID and add to user's valid tokens
    const refreshPayload = await this.jwtService.decodeToken(refreshToken);
    const refreshTokenId = refreshPayload?.jti;

    if (refreshTokenId) {
      const user = await this.usersRepository.findById(userId);
      if (user) {
        user.addRefreshToken(refreshTokenId);
        await this.usersRepository.save(user);
      }
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyToken(refreshToken);
      const userId = payload?.sub;
      const tokenId = payload?.jti;

      if (!userId || !tokenId) {
        throw new DomainUnauthorizedException();
      }

      const user = await this.usersRepository.findById(userId);
      if (!user || user.deletedAt) {
        throw new DomainUnauthorizedException();
      }

      if (!user.isRefreshTokenValid(tokenId)) {
        throw new DomainUnauthorizedException();
      }

      user.removeRefreshToken(tokenId);

      const newAccessToken = this.jwtService.createJwtToken(
        userId,
        'deviceId',
        this.jwtConfig.accessTokenExpiresIn,
        false
      );

      const newRefreshToken = this.jwtService.createJwtToken(
        userId,
        'deviceId',
        this.jwtConfig.refreshTokenExpiresIn,
        true
      );

      const newRefreshPayload = await this.jwtService.decodeToken(newRefreshToken);
      const newRefreshTokenId = newRefreshPayload?.jti;

      if (newRefreshTokenId) {
        user.addRefreshToken(newRefreshTokenId);
      }

      await this.usersRepository.save(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new DomainUnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyToken(refreshToken);
      const userId = payload?.sub;
      const tokenId = payload?.jti;

      if (!userId || !tokenId) {
        throw new DomainUnauthorizedException();
      }

      const user = await this.usersRepository.findById(userId);
      if (!user || user.deletedAt) {
        throw new DomainUnauthorizedException();
      }

      if (!user.isRefreshTokenValid(tokenId)) {
        throw new DomainUnauthorizedException();
      }

      user.removeRefreshToken(tokenId);
      await this.usersRepository.save(user);
    } catch (error) {
      // Re-throw unauthorized exceptions, wrap other errors
      if (error instanceof DomainUnauthorizedException) {
        throw error;
      }
      throw new DomainUnauthorizedException();
    }
  }

  async passwordRecovery(
    dto: PasswordRecoveryInputDto,
  ) {
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

  async registration(dto: RegistrationInputDto, ip: string | undefined) {
    const key = `registration:${ip ?? 'unknown'}`;
    const limited = this.rateLimiter.isLimited(
      key,
      this.rateLimiterConfig.max,
      this.rateLimiterConfig.windowMs
    );
    if (limited) {
      throw new TooManyRequestsException()
    }
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
      isEmailConfirmed: this.usersConfig.isAuthomaticallyConfirmed,
      deletedAt: null,
      confirmCode,
      expirationCode,
    });

    await this.usersRepository.save(newUser);

    // Only send confirmation email if manual confirmation is required
    if (!this.usersConfig.isAuthomaticallyConfirmed) {
      this.emailService.sendConfirmationEmail(dto.email, confirmCode);
    }
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

    const userId: string | undefined = payload?.sub;
    if (!userId) {
      throw new DomainUnauthorizedException();
    }

    return await this.usersQueryRepository.getMe(userId);
  }
}
