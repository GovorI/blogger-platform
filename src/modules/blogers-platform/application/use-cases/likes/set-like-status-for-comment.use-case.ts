import { CommandHandler } from '@nestjs/cqrs';
import { LikeStatusInputDto } from '../../../api/input-dto/like-status.input-dto';
import { CommentDocument } from '../../../domain/comment.entity';
import { LikeStatuses } from '../../../domain/base-like.entity';
import {
  LikeStatusComment,
  LikeStatusCommentModelType,
} from '../../../domain/likeStatusComment';
import { LikesRepository } from '../../../infrastructure/likesRepository';
import { CommentRepository } from '../../../infrastructure/comment.repository';
import { InjectModel } from '@nestjs/mongoose';

export class SetLikeStatusForCommentCommand {
  constructor(
    public commentId: string,
    public likeStatusDto: LikeStatusInputDto,
    public userId: string,
  ) {}
}

@CommandHandler(SetLikeStatusForCommentCommand)
export class SetLikeStatusForCommentUseCase {
  constructor(
    @InjectModel(LikeStatusComment.name)
    private LikeStatusCommentModel: LikeStatusCommentModelType,
    private commentRepository: CommentRepository,
    private likesRepository: LikesRepository,
  ) {}

  async execute(
    command: SetLikeStatusForCommentCommand,
  ): Promise<CommentDocument> {
    const comment = await this.commentRepository.findByIdOrNotFoundFail(
      command.commentId,
    );
    const existingLike = await this.likesRepository.getLikeByCommentIdAndUserId(
      command.commentId,
      command.userId,
    );

    if (!existingLike) {
      if (command.likeStatusDto.likeStatus !== LikeStatuses.None) {
        const newLikeStatus = this.LikeStatusCommentModel.createInstance({
          userId: command.userId,
          commentId: command.commentId,
          status: command.likeStatusDto.likeStatus,
        });
        await this.likesRepository.save(newLikeStatus);

        if (command.likeStatusDto.likeStatus === LikeStatuses.Like) {
          comment.LikesInfo.likesCount++;
        } else if (command.likeStatusDto.likeStatus === LikeStatuses.Dislike) {
          comment.LikesInfo.dislikesCount++;
        }
        await this.commentRepository.save(comment);
      }
    } else {
      if (existingLike.status === command.likeStatusDto.likeStatus) {
        return comment;
      }

      const oldStatus = existingLike.status;
      const newStatus = command.likeStatusDto.likeStatus;

      this.updateCommentCounters(comment, oldStatus, newStatus);

      existingLike.status = newStatus;
      await this.likesRepository.save(existingLike);
      await this.commentRepository.save(comment);
    }

    return comment;
  }

  private updateCommentCounters(
    comment: CommentDocument,
    oldStatus: LikeStatuses,
    newStatus: LikeStatuses,
  ) {
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
}
