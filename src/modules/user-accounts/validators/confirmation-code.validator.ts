import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class ConfirmationCodeConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {}

  async validate(code: any) {
    if (typeof code !== 'string' || !code.trim()) return false;

    const user = await this.UserModel.findOne({
      confirmCode: code,
      deletedAt: null,
    }).lean();
    if (!user) return false;
    if (user.isEmailConfirmed) return false;
    if (!user.expirationCode) return false;

    const expiresAt = new Date(user.expirationCode).getTime();
    if (Number.isNaN(expiresAt)) return false;

    return expiresAt >= Date.now();
  }

  defaultMessage(args: ValidationArguments) {
    return 'The confirmation code is incorrect, expired or already applied';
  }
}

export function IsConfirmationCodeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsConfirmationCodeValid',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: ConfirmationCodeConstraint,
    });
  };
}
