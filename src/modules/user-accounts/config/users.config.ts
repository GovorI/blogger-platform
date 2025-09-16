import { Injectable } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { configValidationUtility } from '../../../core/utils/config-validation.utility';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersConfig {
  @IsBoolean({
    message: 'Set Env variable IS_USER_AUTOMATICALLY_CONFIRMED, example: false',
  })
  isAuthomaticallyConfirmed: boolean;

  constructor(private configService: ConfigService) {
    this.isAuthomaticallyConfirmed = configValidationUtility.convertToBoolean(
      this.configService.get<string>('IS_USER_AUTOMATICALLY_CONFIRMED'),
    ) as boolean;

    configValidationUtility.validateConfig(this);
  }
}
