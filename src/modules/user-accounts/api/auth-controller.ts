import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { RegistrationInputDto } from './input-dto/registration.input-dto';
import { AuthService } from '../application/auth-service';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { Request, Response } from 'express';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { ExtractUserFromRequest } from '../guards/decorators/extract-user-from-request';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ConfirmationEmailInputDto } from './input-dto/confirmation-email.input.dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { EmailResendingInputDto } from './input-dto/email-resending.input-dto';
import { UnauthorizedException as DomainUnauthorizedException } from '../../../core/domain/domain.exception';
import { LoginResponseViewDto } from './view-dto/login-response.view-dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CoreConfig } from '../../../core/core.config';
import { RateLimit } from 'src/core/decorators/rate-limit.decorator';
import { RateLimitGuard } from 'src/core/guards/rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly coreConfig: CoreConfig
  ) { }

  private getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.coreConfig.env !== 'testing', // Disable secure in testing
      path: '/',
      sameSite: 'strict' as const
    };
  }

  @Post('login')
  @UseGuards(LocalAuthGuard, RateLimitGuard)
  @RateLimit({ keyPrefix: 'login' })
  @HttpCode(200)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return access token in body. Refresh token is set as httpOnly cookie.'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseViewDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseViewDto> {
    const loginResult = await this.authService.login(user.id);
    console.log(loginResult)

    res.cookie('refreshToken', loginResult.refreshToken, this.getCookieOptions());

    return {
      accessToken: loginResult.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'User logout',
    description: 'Clear refresh token cookie and invalidate refresh token'
  })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new DomainUnauthorizedException();
    }

    try {
      await this.authService.logout(refreshToken);
      res.clearCookie('refreshToken');
      return;
    } catch (error) {
      res.clearCookie('refreshToken');
      throw new DomainUnauthorizedException();
    }
  }

  @Post('refresh-token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access and refresh tokens using refresh token from cookies'
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: LoginResponseViewDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseViewDto> {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new DomainUnauthorizedException();
    }

    const refreshResult = await this.authService.refreshToken(refreshToken);
    console.log('refreshResult: ', refreshResult)
    res.cookie('refreshToken', refreshResult.refreshToken, this.getCookieOptions());

    return {
      accessToken: refreshResult.accessToken,
    };
  }

  @Post('password-recovery')
  @HttpCode(204)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'passwordRecovery' })
  async passwordRecovery(
    @Body() dto: PasswordRecoveryInputDto,
  ) {
    await this.authService.passwordRecovery(dto);
    return;
  }

  @Post('new-password')
  @HttpCode(204)
  async newPassword(@Body() dto: NewPasswordInputDto) {
    await this.authService.newPassword(dto);
  }

  @Post('registration-confirmation')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'registrationConfirmation' })
  @HttpCode(204)
  async registrationConfirmation(@Body() code: ConfirmationEmailInputDto) {
    await this.authService.registrationConfirmation(code);
  }

  @Post('registration')
  @HttpCode(204)
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'registration' })
  async registration(
    @Body() dto: RegistrationInputDto,
    @Req() req: Request,
  ) {

    await this.authService.registration(dto, req.ip);
  }

  @Post('registration-email-resending')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'registration-email-resending' })
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
