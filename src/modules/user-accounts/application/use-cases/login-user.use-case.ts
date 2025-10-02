import { randomUUID } from 'crypto';
import { CommandHandler } from '@nestjs/cqrs';
import { JwtService } from '../jwt-service';
import { UsersRepository } from '../../infrastructure/users.repository';
import { JwtConfig } from '../../../jwt/jwt.config';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../../domain/session.entity';

export class LoginUserCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceName: string,
    public readonly ip: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase {
  constructor(
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly jwtConfig: JwtConfig,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute(command: LoginUserCommand) {
    const deviceId = randomUUID();

    const accessToken = this.jwtService.createJwtToken(
      command.userId,
      deviceId,
      this.jwtConfig.accessTokenExpiresIn,
      false,
    );

    const refreshToken = this.jwtService.createJwtToken(
      command.userId,
      deviceId,
      this.jwtConfig.refreshTokenExpiresIn,
      true,
    );

    const refreshPayload = await this.jwtService.decodeToken(refreshToken);
    if (!refreshPayload || !refreshPayload.jti) {
      throw new Error('Invalid refresh token: missing jti');
    }
    const refreshTokenId = refreshPayload.jti;

    if (refreshTokenId) {
      const user = await this.usersRepository.findById(command.userId);
      if (user) {
        user.addRefreshToken(refreshTokenId, deviceId);
        await this.usersRepository.save(user);
        const session = this.SessionModel.createInstance({
          userId: command.userId,
          deviceId: deviceId,
          deviceName: command.deviceName,
          ip: command.ip,
          iat: refreshPayload.iat,
          exp: refreshPayload.exp,
        });
        try {
          await this.sessionsRepository.save(session);
          console.log(
            `Session created for user ${command.userId}, device: ${command.deviceName}`,
          );
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }
    }

    return {
      accessToken,
      refreshToken,
    };
  }
}
