import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { HydratedDocument, Model } from 'mongoose';

@Schema({ _id: false })
export class CommentatorInfo {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  userLogin: string;
}
export const CommentatorInfoSchema =
  SchemaFactory.createForClass(CommentatorInfo);

@Schema({ _id: false })
export class LikesInfo {
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  dislikesCount: number;
}
export const LikesInfoSchema = SchemaFactory.createForClass(LikesInfo);

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: CommentatorInfoSchema, required: true })
  commentatorInfo: CommentatorInfo;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  @Prop({ type: LikesInfoSchema, required: true })
  LikesInfo: LikesInfo;

  static createInstance(dto: CreateCommentDto): CommentDocument {
    const comment = new this();
    comment.content = dto.content;
    comment.postId = dto.postId;
    comment.commentatorInfo = {
      userId: dto.userId,
      userLogin: dto.userLogin,
    };
    comment.LikesInfo = {
      dislikesCount: 0,
      likesCount: 0,
    };
    return comment as CommentDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;
export type CommentModel = Model<CommentDocument> & typeof Comment;
