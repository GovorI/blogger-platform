import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ async: true })
@Injectable()
export class EmailValidator implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(User.name) private readonly UserModel: UserModelType,
  ) {}

  async validate(email: any) {
    const user = await this.UserModel.findOne({
      email: email,
      deletedAt: null,
    }).lean();
    if (!user) return false;
    if (user.isEmailConfirmed) return false;
    return true;
  }

  defaultMessage(): string {
    return 'Email must belong to a registered user and not be confirmed';
  }
}

export function IsEmailValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsEmailValid',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: EmailValidator,
    });
  };
}
