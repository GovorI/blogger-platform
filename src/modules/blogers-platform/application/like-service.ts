import { Injectable } from "@nestjs/common";
import { PostsRepository } from "../infrastructure/posts.repository";
import { CommentRepository } from "../infrastructure/comment.repository";
import { LikesRepository } from "../infrastructure/likesRepository";
import { InjectModel } from "@nestjs/mongoose";
import { LikeStatusPost, LikeStatusPostModelType } from "../domain/likeStatusPost";
import { LikeStatusComment, LikeStatusCommentModelType } from "../domain/likeStatusComment";
import { UsersService } from "../../user-accounts/application/user-service";
import { LikeStatusInputDto } from "../api/input-dto/like-status.input-dto";
import { LikeStatuses } from "../domain/base-like.entity";
import { PostDocument } from "../domain/post.entity";
import { CommentDocument } from "../domain/comment.entity";


@Injectable()
export class LikesService {
    constructor(
        @InjectModel(LikeStatusPost.name) private LikeStatusPostModel: LikeStatusPostModelType,
        @InjectModel(LikeStatusComment.name) private LikeStatusCommentModel: LikeStatusCommentModelType,
        private readonly likesRepository: LikesRepository,
        private readonly postsRepository: PostsRepository,
        private readonly commentRepository: CommentRepository,
        private readonly usersService: UsersService,
    ) { }

    async setCommentLikeStatus(commentId: string, likeStatusDto: LikeStatusInputDto, userId: string): Promise<CommentDocument> {
        const comment = await this.commentRepository.findByIdOrNotFoundFail(commentId);
        const existingLike = await this.likesRepository.getLikeByCommentIdAndUserId(commentId, userId);

        if (!existingLike) {
            if (likeStatusDto.likeStatus !== LikeStatuses.None) {
                const newLikeStatus = this.LikeStatusCommentModel.createInstance({
                    userId: userId,
                    commentId: commentId,
                    status: likeStatusDto.likeStatus
                });
                await this.likesRepository.save(newLikeStatus);

                if (likeStatusDto.likeStatus === LikeStatuses.Like) {
                    comment.LikesInfo.likesCount++;
                } else if (likeStatusDto.likeStatus === LikeStatuses.Dislike) {
                    comment.LikesInfo.dislikesCount++;
                }
                await this.commentRepository.save(comment);
            }
        } else {
            if (existingLike.status === likeStatusDto.likeStatus) {
                return comment;
            }

            const oldStatus = existingLike.status as LikeStatuses;
            const newStatus = likeStatusDto.likeStatus;

            this.updateCommentCounters(comment, oldStatus, newStatus);

            existingLike.status = newStatus;
            await this.likesRepository.save(existingLike);
            await this.commentRepository.save(comment);
        }

        return comment;
    }

    async setPostLikeStatus(postId: string, likeStatusDto: LikeStatusInputDto, userId: string): Promise<PostDocument> {
        const post = await this.postsRepository.findOrNotFoundFail(postId);
        const user = await this.usersService.getUserByIdOrNotFound(userId);

        const existingLike = await this.likesRepository.getLikeByPostIdAndUserId(post._id.toString(), userId);

        if (!existingLike) {
            if (likeStatusDto.likeStatus !== LikeStatuses.None) {
                const newLikeStatus = this.LikeStatusPostModel.createInstance({
                    userId: userId,
                    login: user.login,
                    postId: post._id.toString(),
                    status: likeStatusDto.likeStatus
                });
                await this.likesRepository.save(newLikeStatus);

                if (likeStatusDto.likeStatus === LikeStatuses.Like) {
                    post.extendedLikesInfo.likesCount++;
                } else if (likeStatusDto.likeStatus === LikeStatuses.Dislike) {
                    post.extendedLikesInfo.dislikesCount++;
                }

                // Update user's status
                post.extendedLikesInfo.myStatus = likeStatusDto.likeStatus;

                // Update newest likes if it's a like
                if (likeStatusDto.likeStatus === LikeStatuses.Like) {
                    await this.updateNewestLikes(post._id.toString(), post);
                }

                await this.postsRepository.save(post);
            }
        } else {
            if (existingLike.status === likeStatusDto.likeStatus) {
                return post;
            }

            const oldStatus = existingLike.status as LikeStatuses;
            const newStatus = likeStatusDto.likeStatus;

            this.updatePostCounters(post, oldStatus, newStatus);

            // Update user's status
            post.extendedLikesInfo.myStatus = newStatus;

            existingLike.status = newStatus;
            await this.likesRepository.save(existingLike);

            // Update newest likes regardless of old or new status
            await this.updateNewestLikes(post._id.toString(), post);

            await this.postsRepository.save(post);
        }

        return post;
    }

    private updateCommentCounters(comment: CommentDocument, oldStatus: LikeStatuses, newStatus: LikeStatuses) {

        if (oldStatus === LikeStatuses.Like) {
            comment.LikesInfo.likesCount--;
        } else if (oldStatus === LikeStatuses.Dislike) {
            comment.LikesInfo.dislikesCount--;
        }

        if (newStatus === LikeStatuses.Like) {
            comment.LikesInfo.likesCount++;
        } else if (newStatus === LikeStatuses.Dislike) {
            comment.LikesInfo.dislikesCount++;
        }
    }

    private updatePostCounters(post: PostDocument, oldStatus: LikeStatuses, newStatus: LikeStatuses) {

        if (oldStatus === LikeStatuses.Like) {
            post.extendedLikesInfo.likesCount--;
        } else if (oldStatus === LikeStatuses.Dislike) {
            post.extendedLikesInfo.dislikesCount--;
        }

        if (newStatus === LikeStatuses.Like) {
            post.extendedLikesInfo.likesCount++;
        } else if (newStatus === LikeStatuses.Dislike) {
            post.extendedLikesInfo.dislikesCount++;
        }
    }

    private async updateNewestLikes(postId: string, post: PostDocument) {
        const newestLikes = await this.likesRepository.getNewestLikesForPost(postId, 3);
        post.extendedLikesInfo.newestLikes = newestLikes.map(like => ({
            addedAt: like.createdAt,
            userId: like.userId,
            login: like.login
        }));
    }
}