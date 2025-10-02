import {
  Get,
  Delete,
  UseGuards,
  Param,
  Controller,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import {
  ExtractUserWithDevice,
  UserWithDeviceContext,
} from '../guards/decorators/extract-user-with-device.decorator';
import { HybridSessionAuthGuard } from '../guards/bearer/hybrid-session-auth.guard';
import { SessionService } from '../application/session-service';
import { SessionViewDto } from './view-dto/session.view-dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('security')
@Controller('security')
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('devices')
  @UseGuards(HybridSessionAuthGuard)
  @ApiOperation({
    summary: 'Get all active sessions',
    description:
      'Returns all active sessions for the current user. Supports both Bearer token and refresh token authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: [SessionViewDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveSessions(
    @ExtractUserWithDevice() user: UserWithDeviceContext,
  ): Promise<SessionViewDto[]> {
    return this.sessionService.getAllSessions(user.id);
  }

  @Delete('devices/:deviceId')
  @UseGuards(HybridSessionAuthGuard)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Terminate specific session',
    description:
      'Terminate session by device ID. Cannot terminate current session. Supports both Bearer token and refresh token authentication.',
  })
  @ApiResponse({ status: 204, description: 'Session terminated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot terminate current session' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(
    @Param('deviceId') deviceId: string,
    @ExtractUserWithDevice() user: UserWithDeviceContext,
  ): Promise<void> {
    // Prevent self-termination by comparing with current device ID
    // The current device ID comes from the authentication context
    if (user.deviceId === deviceId) {
      throw new ForbiddenException('Cannot terminate current session');
    }

    await this.sessionService.deleteSession(user.id, deviceId);
  }

  @Delete('devices')
  @UseGuards(HybridSessionAuthGuard)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Terminate all other sessions',
    description:
      'Terminate all sessions except the current one. Supports both Bearer token and refresh token authentication.',
  })
  @ApiResponse({
    status: 204,
    description: 'All other sessions terminated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAllOtherSessions(
    @ExtractUserWithDevice() user: UserWithDeviceContext,
  ): Promise<void> {
    await this.sessionService.deleteAllSessionsExceptCurrent(
      user.id,
      user.deviceId,
    );
  }
}
