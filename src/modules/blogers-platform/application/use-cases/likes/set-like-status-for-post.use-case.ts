import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatusInputDto } from '../../../api/input-dto/like-status.input-dto';
import { PostDocument } from '../../../domain/post.entity';
import { LikeStatuses } from '../../../domain/base-like.entity';
import { UsersService } from '../../../../user-accounts/application/user-service';
import { LikesRepository } from '../../../infrastructure/likesRepository';
import { PostsRepository } from '../../../infrastructure/posts.repository';
import {
  LikeStatusPost,
  LikeStatusPostModelType,
} from '../../../domain/likeStatusPost';
import { InjectModel } from '@nestjs/mongoose';

export class SetLikeStatusForPostCommand {
  constructor(
    public postId: string,
    public likeStatusDto: LikeStatusInputDto,
    public userId: string,
  ) {}
}

@CommandHandler(SetLikeStatusForPostCommand)
export class SetLikeStatusForPostUseCase
  implements ICommandHandler<SetLikeStatusForPostCommand>
{
  constructor(
    @InjectModel(LikeStatusPost.name)
    private LikeStatusPostModel: LikeStatusPostModelType,
    private postsRepository: PostsRepository,
    private usersService: UsersService,
    private likesRepository: LikesRepository,
  ) {}

  async execute(command: SetLikeStatusForPostCommand) {
    const post = await this.postsRepository.findOrNotFoundFail(command.postId);
    const user = await this.usersService.getUserByIdOrNotFound(command.userId);

    const existingLike = await this.likesRepository.getLikeByPostIdAndUserId(
      post._id.toString(),
      command.userId,
    );

    if (!existingLike) {
      if (command.likeStatusDto.likeStatus !== LikeStatuses.None) {
        const newLikeStatus = this.LikeStatusPostModel.createInstance({
          userId: command.userId,
          login: user.login,
          postId: post._id.toString(),
          status: command.likeStatusDto.likeStatus,
        });
        await this.likesRepository.save(newLikeStatus);

        if (command.likeStatusDto.likeStatus === LikeStatuses.Like) {
          post.extendedLikesInfo.likesCount++;
        } else if (command.likeStatusDto.likeStatus === LikeStatuses.Dislike) {
          post.extendedLikesInfo.dislikesCount++;
        }

        // Update user's status
        post.extendedLikesInfo.myStatus = command.likeStatusDto.likeStatus;

        // Update newest likes if it's a like
        if (command.likeStatusDto.likeStatus === LikeStatuses.Like) {
          await this.updateNewestLikes(post._id.toString(), post);
        }

        await this.postsRepository.save(post);
      }
    } else {
      if (existingLike.status === command.likeStatusDto.likeStatus) {
        return post;
      }
      const oldStatus = existingLike.status;
      const newStatus = command.likeStatusDto.likeStatus;

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

  private async updateNewestLikes(postId: string, post: PostDocument) {
    const newestLikes = await this.likesRepository.getNewestLikesForPost(
      postId,
      3,
    );
    post.extendedLikesInfo.newestLikes = newestLikes.map((like) => ({
      addedAt: like.createdAt,
      userId: like.userId,
      login: like.login,
    }));
  }

  private updatePostCounters(
    post: PostDocument,
    oldStatus: LikeStatuses,
    newStatus: LikeStatuses,
  ) {
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
}
