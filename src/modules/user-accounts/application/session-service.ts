import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../domain/session.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from './jwt-service';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly SessionModel: SessionModelType,
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async getAllSessions(userId: string) {
    try {
      console.log(`Getting sessions for user: ${userId}`);
      const now = Math.floor(Date.now() / 1000);
      const sessions = await this.SessionModel.find({
        userId,
        exp: { $gt: now },
      }).sort({ createdAt: -1 });

      console.log(
        `Found ${sessions.length} active sessions for user ${userId}`,
      );

      return sessions.map((session) => ({
        ip: session.ip,
        title: session.deviceName,
        lastActiveDate: new Date(session.iat * 1000).toISOString(),
        deviceId: session.deviceId,
      }));
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  }

  async deleteSession(userId: string, deviceId: string) {
    const existingSession = await this.SessionModel.findOne({ deviceId });
    if (!existingSession) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Session not found',
      });
    }

    if (existingSession.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Cannot delete session that belongs to another user',
      });
    }

    await this.SessionModel.deleteOne({ userId, deviceId });

    await this.invalidateRefreshTokensForDevice(userId, deviceId);
  }

  async deleteAllSessionsExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ) {
    const sessionsToDelete = await this.SessionModel.find({
      userId,
      deviceId: { $ne: currentDeviceId },
    });

    const result = await this.SessionModel.deleteMany({
      userId,
      deviceId: { $ne: currentDeviceId },
    });

    console.log(
      `Deleted ${result.deletedCount} sessions for user ${userId}, preserving current session ${currentDeviceId}`,
    );

    for (const session of sessionsToDelete) {
      await this.invalidateRefreshTokensForDevice(userId, session.deviceId);
    }
  }

  async deleteAllSessions(userId: string) {
    await this.SessionModel.deleteMany({ userId });

    const user = await this.usersRepository.findById(userId);
    if (user) {
      user.invalidateAllRefreshTokens();
      await this.usersRepository.save(user);
    }
  }

  async cleanupExpiredSessions() {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.SessionModel.deleteMany({ exp: { $lt: now } });
    return result.deletedCount;
  }

  private async extractDeviceIdFromToken(
    refreshToken: string,
  ): Promise<string | null> {
    try {
      const payload = await this.jwtService.decodeToken(refreshToken);
      return payload?.deviceId || null;
    } catch {
      return null;
    }
  }

  private async invalidateRefreshTokensForDevice(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      return;
    }

    user.removeRefreshTokensForDevice(deviceId);
    await this.usersRepository.save(user);
  }
}
