import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) { }

  createJwtToken(userId: string, deviceId: string, lifeTime: string, isRefreshToken: boolean = false) {
    const payload: any = { sub: userId, deviceId };

    if (isRefreshToken) {
      payload.jti = randomUUID(); // JWT ID claim
    }

    return this.jwtService.sign(
      payload,
      {
        expiresIn: lifeTime,
      },
    );
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async decodeToken(token: string): Promise<any> {
    return this.jwtService.decode(token);
  }
}
