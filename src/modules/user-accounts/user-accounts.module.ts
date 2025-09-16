import { Module } from '@nestjs/common';
import { UserController } from './api/user-controller';
import { AuthController } from './api/auth-controller';
import { UsersService } from './application/user-service';
import { AuthService } from './application/auth-service';
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
import { NotificationsModule } from '../notifications/notifications.module';
import { BasicAuthGuard } from './guards/basic/basic-auth.guard';
import { RateLimiterService } from '../../core/services/rate-limiter.service';
import { ConfirmationCodeConstraint } from './validators/confirmation-code.validator';
import { EmailValidator } from './validators/email.validator';
import { UsersConfig } from './config/users.config';
import { RateLimiterConfig } from './config/rate-limiter.config';
import { RateLimitGuard } from 'src/core/guards/rate-limit.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({}),
    JwtAuthModule,
    NotificationsModule,
  ],
  controllers: [UserController, AuthController],
  providers: [
    UsersService,
    AuthService,
    UsersRepository,
    UsersQueryRepository,
    CryptoService,
    LocalStrategy,
    LocalAuthGuard,
    JwtStrategy,
    JwtAuthGuard,
    JwtOptionalGuard,
    RateLimitGuard,
    BasicAuthGuard,
    RateLimiterService,
    ConfirmationCodeConstraint,
    EmailValidator,
    UsersConfig,
    RateLimiterConfig,
  ],
  exports: [AuthService, UsersService],
})
export class UserAccountsModule { }
