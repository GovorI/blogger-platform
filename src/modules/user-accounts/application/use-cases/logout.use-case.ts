import { CommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException as DomainUnauthorizedException } from '../../../../core/domain';
import { JwtService } from '../jwt-service';
import { UsersRepository } from '../../infrastructure/users.repository';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class LogoutUserCommand {
  constructor(public readonly refreshToken: string) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(command: LogoutUserCommand) {
    try {
      const payload = await this.jwtService.verifyToken(command.refreshToken);
      const userId = payload?.sub;
      const tokenId = payload?.jti;
      const deviceId = payload?.deviceId;

      if (!userId || !tokenId || !deviceId) {
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
      await this.sessionsRepository.deleteSessionByUserIdAndDeviceId(
        userId,
        deviceId,
      );
    } catch (error) {
      if (error instanceof DomainUnauthorizedException) {
        throw error;
      }
      throw new DomainUnauthorizedException();
    }
  }
}
