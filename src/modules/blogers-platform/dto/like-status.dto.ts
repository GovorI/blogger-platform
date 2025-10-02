import { IsEnum, IsNotEmpty } from 'class-validator';
import { LikeStatuses } from '../domain/base-like.entity';

export class LikeStatusDto {
  @IsEnum(LikeStatuses)
  @IsNotEmpty()
  likeStatus: LikeStatuses;
}
