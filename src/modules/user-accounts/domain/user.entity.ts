//флаг timestemp автоматичеки добавляет поля upatedAt и createdAt

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { HydratedDocument, Model } from 'mongoose';

/**
 * User Entity Schema
 * This class represents the schema and behavior of a User entity.
 */
@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Boolean, required: true, default: false })
  isEmailConfirmed: boolean;

  @Prop({
    type: String,
    required: function (this: User) {
      return !this.isEmailConfirmed;
    },
    default: null,
  })
  confirmCode: string | null;

  @Prop({
    type: Date,
    required: function (this: User) {
      return !this.isEmailConfirmed;
    },
    default: null,
  })
  expirationCode: Date | null;

  @Prop({ type: String, required: false, default: null })
  passwordRecoveryCode: string | null;

  @Prop({ type: Date, required: false, default: null })
  passwordRecoveryExpiration: Date | null;

  @Prop({ type: [String], required: false, default: [] })
  validRefreshTokens: string[];

  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateUserDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    // Password will be hashed by service
    user.passwordHash = dto.password;
    user.login = dto.login;
    user.isEmailConfirmed = false; // пользователь ВСЕГДА должен после регистрации подтверждить свой Email

    return user as UserDocument;
  }

  /**
   * Marks the user as deleted
   * Throws an error if already deleted
   * @throws {Error} If the entity is already deleted
   * DDD continue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
   */
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  /**
   * Updates the user instance with new data
   * Resets email confirmation if email is updated
   * @param {UpdateUserDto} dto - The data transfer object for user updates
   * DDD continue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
   */
  // update(dto: UpdateUserDto) {
  //   if (dto.email !== this.email) {
  //     this.isEmailConfirmed = false;
  //   }
  //   this.email = dto.email;
  // }

  /**
   * Adds a new refresh token to the valid tokens list
   * @param {string} tokenId - The ID of the refresh token to add
   */
  addRefreshToken(tokenId: string) {
    if (!this.validRefreshTokens) {
      this.validRefreshTokens = [];
    }
    this.validRefreshTokens.push(tokenId);
  }

  /**
   * Removes a refresh token from the valid tokens list
   * @param {string} tokenId - The ID of the refresh token to remove
   */
  removeRefreshToken(tokenId: string) {
    if (!this.validRefreshTokens) {
      return;
    }
    this.validRefreshTokens = this.validRefreshTokens.filter(id => id !== tokenId);
  }

  /**
   * Checks if a refresh token is valid
   * @param {string} tokenId - The ID of the refresh token to check
   * @returns {boolean} True if the token is valid
   */
  isRefreshTokenValid(tokenId: string): boolean {
    if (!this.validRefreshTokens) {
      return false;
    }
    return this.validRefreshTokens.includes(tokenId);
  }

  /**
   * Invalidates all refresh tokens
   */
  invalidateAllRefreshTokens() {
    this.validRefreshTokens = [];
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
