import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../../../../user-accounts/application/user-service';
import { CommentRepository } from '../../../infrastructure/comment.repository';
import { CommentDocument } from '../../../domain/comment.entity';

export class CreateCommentForPostCommand {
  constructor(
    public postId: string,
    public content: string,
    public userId: string,
  ) {}
}

@CommandHandler(CreateCommentForPostCommand)
export class CreateCommentForPostUseCase
  implements ICommandHandler<CreateCommentForPostCommand>
{
  constructor(
    private usersService: UsersService,
    private commentRepository: CommentRepository,
  ) {}

  async execute(
    command: CreateCommentForPostCommand,
  ): Promise<CommentDocument> {
    const userInfo = await this.usersService.getUserByIdOrNotFound(
      command.userId,
    );
    return await this.commentRepository.createComment({
      postId: command.postId,
      content: command.content,
      userId: command.userId,
      userLogin: userInfo.login,
    });
  }
}
