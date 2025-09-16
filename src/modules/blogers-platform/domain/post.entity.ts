import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreatePostDto } from '../dto/create-post.dto';
import { HydratedDocument, Model } from 'mongoose';
import { LikeStatuses } from './base-like.entity';

@Schema({ _id: false })
export class ExtendedLikesInfo {
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  dislikesCount: number;

  @Prop({ type: String, enum: LikeStatuses, required: true, default: LikeStatuses.None })
  myStatus: string;

  @Prop({ type: [Object], default: [] })
  newestLikes: any[];
}
export const ExtendedLikesInfoSchema = SchemaFactory.createForClass(ExtendedLikesInfo);

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  @Prop({ type: ExtendedLikesInfoSchema, required: true })
  extendedLikesInfo: ExtendedLikesInfo;

  static createInstance(dto: CreatePostDto): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatuses.None,
      newestLikes: []
    };

    return post as PostDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<Post> & typeof Post;
