import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../../core/domain/domain.exception';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.UserModel.findById(id);
    if (!user || user.deletedAt !== null) {
      throw new UserNotFoundException('User not found');
    }

    return user;
  }

  async getUserByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email });
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
      deletedAt: null,
    });
  }

  async findUserByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ confirmCode: code, deletedAt: null });
  }

  async findUserByPasswordRecoveryCode(
    code: string,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      passwordRecoveryCode: code,
      deletedAt: null,
    });
  }
}
