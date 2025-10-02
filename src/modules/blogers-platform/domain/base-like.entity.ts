import { Prop, Schema } from '@nestjs/mongoose';

export enum LikeStatuses {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

@Schema({ timestamps: true })
export abstract class BaseLikeStatus {
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: String, enum: LikeStatuses, required: true })
  status: LikeStatuses;

  createdAt: Date;
  updatedAt: Date;
}
