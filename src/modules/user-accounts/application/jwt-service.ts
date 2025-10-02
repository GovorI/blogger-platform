import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../domain/jwt-payload.interface';

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  createJwtToken(
    userId: string,
    deviceId: string,
    lifeTime: string,
    isRefreshToken: boolean = false,
  ): string {
    const payload: Partial<JwtPayload> = {
      sub: userId,
      deviceId,
    };

    if (isRefreshToken) {
      payload.jti = randomUUID(); // JWT ID claim
    }

    return this.jwtService.sign(payload, {
      expiresIn: lifeTime,
    });
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return Promise.resolve(this.jwtService.verify<JwtPayload>(token));
    } catch (error) {
      console.log(error);
      throw new Error('Invalid token');
    }
  }

  async decodeToken(token: string): Promise<JwtPayload | null> {
    const decoded: JwtPayload | null = this.jwtService.decode(token);
    return Promise.resolve(decoded);
  }
}
