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
import { NotificationsModule } from '../notifications/notifications.module';
import { BasicAuthGuard } from './guards/basic/basic-auth.guard';
import { RateLimiterService } from './application/rate-limiter.service';
import { ConfirmationCodeConstraint } from './validators/confirmation-code.validator';
import { EmailValidator } from './validators/email.validator';

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
    BasicAuthGuard,
    RateLimiterService,
    ConfirmationCodeConstraint,
    EmailValidator,
  ],
  exports: [AuthService],
})
export class UserAccountsModule {}
