import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { LikeStatuses } from '../domain/base-like.entity';

export class CreateLikeStatusCommentDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    commentId: string;

    @IsNotEmpty()
    @IsEnum(LikeStatuses)
    status: LikeStatuses;
}