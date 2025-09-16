import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";
import { BaseLikeStatus } from "./base-like.entity";
import { CreateLikeStatusPostDto } from "../dto/create-like-status-post.dto";


@Schema({ timestamps: true })
export class LikeStatusPost extends BaseLikeStatus {
    @Prop({ type: String, required: true })
    login: string

    @Prop({ type: String, required: true })
    postId: string;

    static createInstance(dto: CreateLikeStatusPostDto): LikeStatusPostDocument {
        const likeStatus = new this();
        likeStatus.userId = dto.userId;
        likeStatus.login = dto.login;
        likeStatus.postId = dto.postId;
        likeStatus.status = dto.status;

        return likeStatus as LikeStatusPostDocument;
    }
}

export const LikeStatusPostSchema = SchemaFactory.createForClass(LikeStatusPost);
LikeStatusPostSchema.loadClass(LikeStatusPost);

export type LikeStatusPostDocument = HydratedDocument<LikeStatusPost>;
export type LikeStatusPostModelType = Model<LikeStatusPost> & typeof LikeStatusPost;