import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument, CommentModel } from '../domain/comment.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { LikesRepository } from './likesRepository';
import { LikeStatuses } from '../domain/base-like.entity';
import { GetCommentsQueryParams } from '../api/comments/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../api/view-dto/comment.view-dto';

@Injectable()
export class CommentsQueryRepository {
    constructor(
        @InjectModel(Comment.name) private CommentModel: CommentModel,
        private readonly likesRepository: LikesRepository
    ) { }

    async getByIdOrNotFoundFail(id: string, currentUserId?: string): Promise<CommentDocument & { myStatus: string }> {
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: 'Comment not found'
            });
        }

        const comment = await this.CommentModel.findById(id);

        if (!comment || comment.deletedAt !== null) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: 'Comment not found'
            });
        }

        let myStatus: string = LikeStatuses.None;

        if (currentUserId) {
            try {
                const userLike = await this.likesRepository.getLikeByCommentIdAndUserId(id, currentUserId);
                if (userLike) {
                    myStatus = userLike.status as string;
                }
            } catch (error) {
                // If there's an error getting the like status, default to None
                myStatus = LikeStatuses.None;
            }
        }

        (comment as any).myStatus = myStatus;

        return comment as unknown as CommentDocument & { myStatus: string };
    }

    async getAllCommentsForPost(postId: string, query: GetCommentsQueryParams, currentUserId?: string): Promise<PaginatedViewDto<CommentViewDto[]>> {
        const skip = query.calculateSkip();
        const limit = query.pageSize;
        const sortField = query.sortBy || 'createdAt';
        const sortDirection = query.sortDirection === 'asc' ? 1 : -1;

        // Create sort object
        const sort: any = { [sortField]: sortDirection };

        // Get comments with pagination
        const comments = await this.CommentModel
            .find({ postId, deletedAt: null })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .exec();

        // Get total count
        const totalCount = await this.CommentModel.countDocuments({ postId, deletedAt: null });

        // Transform to view DTOs with dynamic like status calculation
        const items: CommentViewDto[] = [];
        for (const comment of comments) {
            let myStatus: string = LikeStatuses.None;

            if (currentUserId) {
                try {
                    const userLike = await this.likesRepository.getLikeByCommentIdAndUserId(comment._id.toString(), currentUserId);
                    if (userLike) {
                        myStatus = userLike.status;
                    }
                } catch (error) {
                    myStatus = LikeStatuses.None;
                }
            }

            const commentViewDto = CommentViewDto.mapToView(comment, currentUserId, myStatus);
            items.push(commentViewDto);
        }

        return PaginatedViewDto.mapToView({
            items,
            totalCount,
            pageNumber: query.pageNumber,
            pageSize: query.pageSize,
        });
    }
}