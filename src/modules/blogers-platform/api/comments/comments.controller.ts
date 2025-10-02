import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/extract-user-from-request';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UpdateCommentDto } from '../../dto/update-comment.dto';
import { LikeStatusInputDto } from '../input-dto/like-status.input-dto';
import { JwtOptionalGuard } from '../../../user-accounts/guards/bearer/jwt-optional.guard';
import { CommentViewDto } from '../view-dto/comment.view-dto';
import { CommandBus } from '@nestjs/cqrs';
import { SetLikeStatusForCommentCommand } from '../../application/use-cases/likes/set-like-status-for-comment.use-case';
import { UpdateCommentCommand } from '../../application/use-cases/comments/update-comment.use-case';
import { DeleteCommentCommand } from '../../application/use-cases/comments/delete-comment.use-case';
import { CommentsQueryRepository } from '../../infrastructure/comment.query-repository';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalGuard)
  async getCommentById(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto | null,
  ): Promise<CommentViewDto> {
    const userId = user?.id || null;
    const comment = await this.commentQueryRepository.getByIdOrNotFoundFail(
      id,
      userId || undefined,
    );
    return CommentViewDto.mapToView(comment, userId, comment.myStatus);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async updateCommentById(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    await this.commandBus.execute(new UpdateCommentCommand(id, dto, user.id));
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async updateCommentLikeStatus(
    @Param('id') commentId: string,
    @Body() likeStatusDto: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    await this.commandBus.execute(
      new SetLikeStatusForCommentCommand(commentId, likeStatusDto, user.id),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteCommentById(
    @Param('id') commentId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    await this.commandBus.execute(new DeleteCommentCommand(commentId, user.id));
  }
}
