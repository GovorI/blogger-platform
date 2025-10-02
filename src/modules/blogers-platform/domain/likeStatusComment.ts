import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { BaseLikeStatus } from './base-like.entity';
import { CreateLikeStatusCommentDto } from '../dto/create-like-status-comment.dto';

@Schema({ timestamps: true })
export class LikeStatusComment extends BaseLikeStatus {
  @Prop({ type: String, required: true })
  commentId: string;

  static createInstance(
    dto: CreateLikeStatusCommentDto,
  ): LikeStatusCommentDocument {
    const likeStatus = new this();
    likeStatus.userId = dto.userId;
    likeStatus.commentId = dto.commentId;
    likeStatus.status = dto.status;

    return likeStatus as LikeStatusCommentDocument;
  }
}

export const LikeStatusCommentSchema =
  SchemaFactory.createForClass(LikeStatusComment);
LikeStatusCommentSchema.loadClass(LikeStatusComment);

export type LikeStatusCommentDocument = HydratedDocument<LikeStatusComment>;
export type LikeStatusCommentModelType = Model<LikeStatusComment> &
  typeof LikeStatusComment;
