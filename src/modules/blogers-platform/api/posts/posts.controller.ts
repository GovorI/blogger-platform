import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import {
  CreatePostInputDto,
  UpdatePostInputDto,
} from '../input-dto/post.input.dto';
import { GetPostsQueryParams } from './get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { PostViewDto } from '../view-dto/post.view-dto';
import { CreateCommentInputDto } from '../input-dto/create-comment.input.dto';
import { LikeStatusInputDto } from '../input-dto/like-status.input-dto';
import { GetCommentsQueryParams } from '../comments/get-comments-query-params.input-dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { JwtOptionalGuard } from '../../../user-accounts/guards/bearer/jwt-optional.guard';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/extract-user-from-request';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CommentViewDto } from '../view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/comment.query-repository';
import { CreatePostForBlogCommand } from '../../application/use-cases/posts/create-post-for-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { UpdatePostCommand } from '../../application/use-cases/posts/update-post.use-case';
import { DeletePostCommand } from '../../application/use-cases/posts/delete-post.use-case';
import { CreateCommentForPostCommand } from '../../application/use-cases/comments/create-comment-for-post.use-case';
import { CommentDocument } from '../../domain/comment.entity';
import { SetLikeStatusForPostCommand } from '../../application/use-cases/likes/set-like-status-for-post.use-case';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() dto: CreatePostInputDto): Promise<PostViewDto> {
    const postId: string = await this.commandBus.execute(
      new CreatePostForBlogCommand(dto),
    );
    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put('/:id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async likePost(
    @Param('id') postId: string,
    @Body() likeStatus: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    await this.commandBus.execute(
      new SetLikeStatusForPostCommand(postId, likeStatus, user.id),
    );
  }

  @Get('/:id/comments')
  @UseGuards(JwtOptionalGuard)
  async getAllCommentsForPost(
    @Param('id') id: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserFromRequest() user: UserContextDto | null,
  ) {
    await this.postsQueryRepository.getByIdOrNotFoundFail(id);
    const userId = user?.id || undefined;
    return this.commentsQueryRepository.getAllCommentsForPost(
      id,
      query,
      userId,
    );
  }

  @Post('/:id/comments')
  @UseGuards(JwtAuthGuard)
  async createCommentForPost(
    @Param('id') postId: string,
    @Body() createCommentInputDto: CreateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    await this.postsQueryRepository.getByIdOrNotFoundFail(postId);

    const comment: CommentDocument = await this.commandBus.execute(
      new CreateCommentForPostCommand(
        postId,
        createCommentInputDto.content,
        user.id,
      ),
    );

    return CommentViewDto.mapToView(comment, user.id, 'None');
  }

  @Get()
  @UseGuards(JwtOptionalGuard)
  async getAll(
    @Query() query: GetPostsQueryParams,
    @Req() req: Request & { user?: UserContextDto },
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const currentUserId = req.user?.id;
    return this.postsQueryRepository.getAll(query, currentUserId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalGuard)
  async getById(
    @Param('id') id: string,
    @Req() req: Request & { user?: UserContextDto },
  ) {
    // Extract user ID if present in the request (set by optional auth middleware)
    const currentUserId = req.user?.id;
    return await this.postsQueryRepository.getByIdOrNotFoundFail(
      id,
      currentUserId,
    );
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostInputDto) {
    await this.commandBus.execute(new UpdatePostCommand(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async deletePost(@Param('id') id: string) {
    await this.commandBus.execute(new DeletePostCommand(id));
  }
}
