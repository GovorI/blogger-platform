import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private SessionModel: SessionModelType,
  ) {}

  async save(session: SessionDocument) {
    await session.save();
  }

  async findSessionByUserIdAndDeviceId(userId: string, deviceId: string) {
    return this.SessionModel.findOne({ userId, deviceId });
  }

  async deleteSessionByUserIdAndDeviceId(userId: string, deviceId: string) {
    await this.SessionModel.deleteOne({ userId, deviceId });
  }
}
