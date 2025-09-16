import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { LikeStatusComment, LikeStatusCommentModelType } from "../domain/likeStatusComment";
import { DomainExceptionCode } from "../../../core/exceptions/domain-exception-codes";
import { DomainException } from "../../../core/exceptions/domain-exceptions";
import { LikeStatusPost, LikeStatusPostModelType } from "../domain/likeStatusPost";

@Injectable()
export class LikesRepository {
    constructor(@InjectModel(LikeStatusPost.name) private LikeStatusPostModel: LikeStatusPostModelType,
        @InjectModel(LikeStatusComment.name) private LikeStatusCommentModel: LikeStatusCommentModelType) { }


    async getLikeByPostIdAndUserIdOrFail(postId: string, userId: string) {
        const like = await this.LikeStatusPostModel.findOne({ postId, userId })
        if (!like) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: 'Like not found'
            })
        }
        return like
    }

    async getLikeByPostIdAndUserId(postId: string, userId: string) {
        return await this.LikeStatusPostModel.findOne({ postId, userId })
    }

    async save(likeStatus: any) {
        return await likeStatus.save();
    }

    async getNewestLikesForPost(postId: string, limit: number = 3) {
        return await this.LikeStatusPostModel
            .find({ postId, status: 'Like' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('userId login createdAt')
            .lean()
            .exec();
    }


    async getLikeByCommentIdAndUserId(commentId: string, userId: string) {
        return await this.LikeStatusCommentModel.findOne({ commentId, userId })
    }

    async getLikeByCommentIdAndUserIdOrFail(commentId: string, userId: string) {
        const like = await this.LikeStatusCommentModel.findOne({ commentId, userId })
        if (!like) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: 'Comment like not found'
            })
        }
        return like
    }
}