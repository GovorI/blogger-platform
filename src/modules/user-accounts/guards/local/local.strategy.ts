import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../application/auth-service';
import { UserContextDto } from '../dto/user-context.dto';
import { UnauthorizedException } from 'src/core/domain/domain.exception';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail' });
  }

  //validate возвращает то, что впоследствии будет записано в req.user
  async validate(username: string, password: string): Promise<UserContextDto> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      // throw new UnauthorizedException('Invalid credentials');
      throw new UnauthorizedException();
    }

    return user;
  }
}
