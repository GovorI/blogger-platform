import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RegistrationInputDto } from './input-dto/registration.input-dto';
import { AuthService } from '../application/auth-service';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { Request } from 'express';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../guards/decorators/extract-user-from-request';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { Req } from '@nestjs/common';
import { ConfirmationEmailInputDto } from './input-dto/confirmation-email.input.dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { EmailResendingInputDto } from './input-dto/email-resending.input-dto';
import { UnauthorizedException as DomainUnauthorizedException } from '../../../core/domain/domain.exception';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(@ExtractUserFromRequest() user: UserContextDto) {
    return this.authService.login(user.id);
  }

  @Post('password-recovery')
  @HttpCode(204)
  async passwordRecovery(
    @Body() dto: PasswordRecoveryInputDto,
    @Req() req: Request,
  ) {
    await this.authService.passwordRecovery(dto, req.ip);
    return;
  }

  @Post('new-password')
  @HttpCode(204)
  async newPassword(@Body() dto: NewPasswordInputDto) {
    await this.authService.newPassword(dto);
  }
  @Post('registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(@Body() code: ConfirmationEmailInputDto) {
    await this.authService.registrationConfirmation(code);
  }

  @Post('registration')
  @HttpCode(204)
  async registration(@Body() dto: RegistrationInputDto) {
    await this.authService.registration(dto);
  }

  @Post('registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(@Body() dto: EmailResendingInputDto) {
    await this.authService.registrationEmailResending(dto);
  }

  @Get('me')
  @HttpCode(200)
  async getMe(@Req() req: Request, @Body() body?: any) {
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length);
    }
    if (!token && body && typeof body.accessToken === 'string') {
      token = body.accessToken;
    }
    const q = req.query as any;
    if (!token && q && typeof q.accessToken === 'string') {
      token = q.accessToken as string;
    }
    if (!token) {
      throw new DomainUnauthorizedException();
    }
    return this.authService.getMe(token);
  }
}
