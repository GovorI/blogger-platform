import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModel,
} from '../domain/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentRepository {
  constructor(@InjectModel(Comment.name) private CommentModel: CommentModel) {}

  async save(comment: CommentDocument) {
    await comment.save();
  }

  async findById(id: string): Promise<CommentDocument | null> {
    return this.CommentModel.findById(id);
  }

  async findByIdOrNotFoundFail(id: string): Promise<CommentDocument> {
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    const comment = await this.CommentModel.findById(id);
    if (!comment || comment.deletedAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }
    return comment;
  }

  async createComment(
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDocument> {
    const comment = this.CommentModel.createInstance(createCommentDto);
    await this.save(comment);
    return comment;
  }
}
