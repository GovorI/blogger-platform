import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";

export enum LikeStatuses {
    Like = "Like",
    Dislike = "Dislike",
    None = "None",
}

@Schema({ timestamps: true })
export abstract class BaseLikeStatus {
    @Prop({ type: String, required: true })
    userId: string;
    @Prop({ type: String, enum: LikeStatuses, required: true })
    status: string;

    createdAt: Date;
    updatedAt: Date;
}

