import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../../application/jwt-service';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class RefreshTokenAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersRepository: UsersRepository,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const refreshToken = request.cookies?.refreshToken;

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            const payload = await this.jwtService.verifyToken(refreshToken);
            const userId = payload?.sub;
            const tokenId = payload?.jti;
            const deviceId = payload?.deviceId;

            if (!userId || !tokenId || !deviceId) {
                throw new UnauthorizedException('Invalid refresh token payload');
            }

            const user = await this.usersRepository.findById(userId);
            if (!user || user.deletedAt) {
                throw new UnauthorizedException('User not found or deleted');
            }

            if (!user.isRefreshTokenValid(tokenId)) {
                throw new UnauthorizedException('Refresh token is invalid');
            }

            request.user = {
                id: userId,
                deviceId: deviceId
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}