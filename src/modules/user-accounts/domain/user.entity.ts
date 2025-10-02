//флаг timestemp автоматичеки добавляет поля upatedAt и createdAt

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { HydratedDocument, Model } from 'mongoose';

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
      //todo false
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

  @Prop({
    type: Object,
    required: false,
    default: {},
  })
  deviceToTokenMapping: Record<string, string>;

  createdAt: Date;
  updatedAt: Date;

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
   * @param {string} deviceId - The device ID associated with this token
   */
  addRefreshToken(tokenId: string, deviceId?: string) {
    if (!this.validRefreshTokens) {
      this.validRefreshTokens = [];
    }
    this.validRefreshTokens.push(tokenId);

    if (deviceId) {
      if (!this.deviceToTokenMapping) {
        this.deviceToTokenMapping = {};
      }
      this.deviceToTokenMapping[deviceId] = tokenId;
      // Mark the field as modified for Mongoose to persist changes
      (this as any).markModified('deviceToTokenMapping');
    }
  }

  /**
   * Removes a refresh token from the valid tokens list
   * @param {string} tokenId - The ID of the refresh token to remove
   */
  removeRefreshToken(tokenId: string) {
    if (!this.validRefreshTokens) {
      return;
    }
    this.validRefreshTokens = this.validRefreshTokens.filter(
      (id) => id !== tokenId,
    );

    if (this.deviceToTokenMapping) {
      for (const [deviceId, mappedTokenId] of Object.entries(
        this.deviceToTokenMapping,
      )) {
        if (mappedTokenId === tokenId) {
          delete this.deviceToTokenMapping[deviceId];
          // Mark the field as modified for Mongoose to persist changes
          (this as any).markModified('deviceToTokenMapping');
          break;
        }
      }
    }
  }

  removeRefreshTokensForDevice(deviceId: string) {
    if (!this.deviceToTokenMapping) {
      return;
    }

    const tokenId = this.deviceToTokenMapping[deviceId];

    if (tokenId) {
      this.removeRefreshToken(tokenId);
    }
  }

  isRefreshTokenValid(tokenId: string): boolean {
    if (!this.validRefreshTokens) {
      return false;
    }
    return this.validRefreshTokens.includes(tokenId);
  }

  invalidateAllRefreshTokens() {
    this.validRefreshTokens = [];
    if (this.deviceToTokenMapping) {
      this.deviceToTokenMapping = {};
      // Mark the field as modified for Mongoose to persist changes
      (this as any).markModified('deviceToTokenMapping');
    }
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
