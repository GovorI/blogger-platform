import { CommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException as DomainUnauthorizedException } from '../../../../core/domain';
import { UsersRepository } from '../../infrastructure/users.repository';
import { JwtService } from '../jwt-service';
import { JwtConfig } from '../../../jwt/jwt.config';
import { SessionsRepository } from '../../infrastructure/sessions.repository';

export class RefreshTokenCommand {
  constructor(public refreshToken: string) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfig,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(command: RefreshTokenCommand) {
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

      const newAccessToken = this.jwtService.createJwtToken(
        userId,
        deviceId,
        this.jwtConfig.accessTokenExpiresIn,
        false,
      );

      const newRefreshToken = this.jwtService.createJwtToken(
        userId,
        deviceId,
        this.jwtConfig.refreshTokenExpiresIn,
        true,
      );

      const newRefreshPayload =
        await this.jwtService.decodeToken(newRefreshToken);
      const newRefreshTokenId = newRefreshPayload?.jti;

      if (newRefreshTokenId) {
        user.addRefreshToken(newRefreshTokenId, deviceId);

        // const session = await this.SessionModel.findOne({ userId, deviceId });
        const session =
          await this.sessionsRepository.findSessionByUserIdAndDeviceId(
            userId,
            deviceId,
          );
        if (session) {
          session.iat = newRefreshPayload.iat;
          session.exp = newRefreshPayload.exp;
          // await session.save();
          await this.sessionsRepository.save(session);
        }
      }

      await this.usersRepository.save(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new DomainUnauthorizedException();
    }
  }
}
