import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../../application/auth-service';
import { UserContextDto } from '../dto/user-context.dto';
import { UnauthorizedException } from '../../../../core/domain/domain.exception';
import { ValidationException } from '../../../../core/domain/domain.exception';
import { Extension } from '../../../../core/exceptions/domain-exceptions';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail' });
  }

  //validate возвращает то, что впоследствии будет записано в req.user
  async validate(username: string, password: string): Promise<UserContextDto> {
    // Trim whitespace and validate inputs
    const trimmedUsername = username?.trim() || '';
    const trimmedPassword = password?.trim() || '';

    const errors: Extension[] = [];

    // Validate loginOrEmail - should not be empty after trim and should be valid email or username
    if (!trimmedUsername) {
      errors.push(new Extension('loginOrEmail should not be empty', 'loginOrEmail'));
    }

    // Validate password - should be between 6 and 20 characters after trim
    if (!trimmedPassword) {
      errors.push(new Extension('password should not be empty', 'password'));
    } else if (trimmedPassword.length < 6 || trimmedPassword.length > 20) {
      errors.push(new Extension('password must be longer than or equal to 6 and shorter than or equal to 20 characters', 'password'));
    }

    if (errors.length > 0) {
      throw new ValidationException('Validation failed', errors);
    }

    const user = await this.authService.validateUser(trimmedUsername, trimmedPassword);
    if (!user) {
      // throw new UnauthorizedException('Invalid credentials');
      throw new UnauthorizedException();
    }

    return user;
  }
}
