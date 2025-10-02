import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { AuthController } from './api/auth-controller';
import { SessionController } from './api/sessions-controller';
import { UsersService } from './application/user-service';
import { AuthService } from './application/auth-service';
import { SessionService } from './application/session-service';
import { SessionCleanupService } from './application/session-cleanup.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/users.query-repository';
import { CryptoService } from './application/crypto-service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './guards/local/local.strategy';
import { LocalAuthGuard } from './guards/local/local-auth.guard';
import { JwtAuthModule } from '../jwt/jwt.module';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { JwtAuthGuard } from './guards/bearer/jwt-auth.guard';
import { JwtOptionalGuard } from './guards/bearer/jwt-optional.guard';
import { RefreshTokenAuthGuard } from './guards/bearer/refresh-token-auth.guard';
import { HybridSessionAuthGuard } from './guards/bearer/hybrid-session-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { BasicAuthGuard } from './guards/basic/basic-auth.guard';
import { RateLimiterService } from '../../core/services/rate-limiter.service';
import { ConfirmationCodeConstraint } from './validators/confirmation-code.validator';
import { EmailValidator } from './validators/email.validator';
import { UsersConfig } from './config/users.config';
import { RateLimiterConfig } from './config/rate-limiter.config';
import { RateLimitGuard } from '../../core/guards/rate-limit.guard';
import { Session, SessionSchema } from './domain/session.entity';
import { SessionsRepository } from './infrastructure/sessions.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { LogoutUserUseCase } from './application/use-cases/logout.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { NewPasswordUseCase } from './application/use-cases/new-password.use-case';
import { PasswordRecoveryUseCase } from './application/use-cases/password-recovery.use-case';
import { RegistrationUseCase } from './application/use-cases/registration.use-case';
import { RegistrationConfirmationUseCase } from './application/use-cases/registration-confirmation.use-case';
import { RegistrationEmailResendingUseCase } from './application/use-cases/registration-email-resending.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';

const useCases = [
  LoginUserUseCase,
  LogoutUserUseCase,
  NewPasswordUseCase,
  PasswordRecoveryUseCase,
  RegistrationUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  RefreshTokenUseCase,
  GetMeUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    PassportModule.register({}),
    JwtAuthModule,
    NotificationsModule,
    CqrsModule,
  ],
  controllers: [UserController, AuthController, SessionController],
  providers: [
    UsersService,
    AuthService,
    SessionService,
    SessionCleanupService,
    SessionsRepository,
    UsersRepository,
    UsersQueryRepository,
    CryptoService,
    LocalStrategy,
    LocalAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
    JwtOptionalGuard,
    RefreshTokenAuthGuard,
    HybridSessionAuthGuard,
    RateLimitGuard,
    BasicAuthGuard,
    RateLimiterService,
    ConfirmationCodeConstraint,
    EmailValidator,
    UsersConfig,
    RateLimiterConfig,
    ...useCases,
  ],
  exports: [AuthService, UsersService, SessionService],
})
export class UserAccountsModule {}
