import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '../user-accounts/application/jwt-service';
import { JwtStrategy } from '../user-accounts/guards/bearer/jwt.strategy';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'default_secret_key',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        }),
    ],
    providers: [JwtService, JwtStrategy],
    exports: [JwtService, JwtModule],
})
export class JwtAuthModule { }
