import { Injectable } from "@nestjs/common";
import { CommentRepository } from "../infrastructure/comment.repository";
import { CommentsQueryRepository } from "../infrastructure/comment.query-repository";
import { CommentDocument } from "../domain/comment.entity";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { CreateCommentInputDto } from "../api/input-dto/create-comment.input.dto";
import { DomainException } from "../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../core/exceptions/domain-exception-codes";
import { UpdateCommentDto } from "../dto/update-comment.dto";

@Injectable()
export class CommentsService {
    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly commentQueryRepository: CommentsQueryRepository
    ) {
    }

    async createCommentForPost(createCommentDto: CreateCommentDto): Promise<CommentDocument> {
        return this.commentRepository.createComment(createCommentDto);
    }

    async updateCommentById(commentId: string, updateCommentDto: UpdateCommentDto, userId: string) {
        const comment = await this.commentRepository.findByIdOrNotFoundFail(commentId);
        if (comment.commentatorInfo.userId !== userId) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'You are not allowed to edit this comment'
            })
        }
        comment.content = updateCommentDto.content;
        return this.commentRepository.save(comment)
    }

    async deleteComment(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentRepository.findByIdOrNotFoundFail(commentId);
        if (comment.commentatorInfo.userId !== userId) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: 'You are not allowed to delete this comment'
            })
        }
        comment.makeDeleted();
        await this.commentRepository.save(comment);
    }

    async getCommentById(id: string, userId: string | null): Promise<CommentDocument & { myStatus: string }> {
        return this.commentQueryRepository.getByIdOrNotFoundFail(id, userId || undefined);
    }
}