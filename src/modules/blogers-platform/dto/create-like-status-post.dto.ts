import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { LikeStatuses } from '../domain/base-like.entity';

export class CreateLikeStatusPostDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    login: string;

    @IsNotEmpty()
    @IsString()
    postId: string;

    @IsNotEmpty()
    @IsEnum(LikeStatuses)
    status: LikeStatuses;
}