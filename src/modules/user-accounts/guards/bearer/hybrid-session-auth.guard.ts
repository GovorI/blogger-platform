import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../../application/jwt-service';
import { UsersRepository } from '../../infrastructure/users.repository';

@Injectable()
export class HybridSessionAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersRepository: UsersRepository,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        // Try Bearer token first
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.substring(7);
            try {
                const payload = await this.jwtService.verifyToken(accessToken);
                const userId = payload?.sub;
                const deviceId = payload?.deviceId;

                if (userId && deviceId) {
                    const user = await this.usersRepository.findById(userId);
                    if (user && !user.deletedAt) {
                        request.user = {
                            id: userId,
                            deviceId: deviceId
                        };
                        return true;
                    }
                }
            } catch (error) {
                // Bearer token failed, try refresh token
            }
        }

        // Try refresh token from cookies
        const refreshToken = request.cookies?.refreshToken;
        if (refreshToken) {
            try {
                const payload = await this.jwtService.verifyToken(refreshToken);
                const userId = payload?.sub;
                const tokenId = payload?.jti;
                const deviceId = payload?.deviceId;

                if (userId && tokenId && deviceId) {
                    const user = await this.usersRepository.findById(userId);
                    if (user && !user.deletedAt && user.isRefreshTokenValid(tokenId)) {
                        request.user = {
                            id: userId,
                            deviceId: deviceId
                        };
                        return true;
                    }
                }
            } catch (error) {
                // Refresh token also failed
            }
        }

        throw new UnauthorizedException('Authentication required');
    }
}