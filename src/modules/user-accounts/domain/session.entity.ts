import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CreateSessionDto } from "../dto/create-session.dto";
import { HydratedDocument, Model } from "mongoose";

@Schema({ timestamps: true })
export class Session {
    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: String, required: true })
    deviceId: string;

    @Prop({ type: String, required: true })
    deviceName: string;

    @Prop({ type: String, required: true })
    ip: string

    @Prop({ type: Number, required: true })
    iat: number;

    @Prop({ type: Number, required: true })
    exp: number;

    createdAt: Date;
    updatedAt: Date;

    static createInstance(dto: CreateSessionDto): SessionDocument {
        const session = new this();
        session.userId = dto.userId;
        session.deviceId = dto.deviceId;
        session.deviceName = dto.deviceName;
        session.ip = dto.ip;
        session.iat = dto.iat;
        session.exp = dto.exp;

        return session as SessionDocument;

    }
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.loadClass(Session);
export type SessionDocument = HydratedDocument<Session>;
export type SessionModelType = Model<SessionDocument> & typeof Session;