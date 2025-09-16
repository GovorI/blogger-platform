import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  HttpCode,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { PostsService } from '../../application/posts-service';
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
import { UsersService } from '../../../user-accounts/application/user-service';
import { CommentsService } from '../../application/comment-service';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { LikesService } from '../../application/like-service';
import { CommentViewDto } from '../view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/comment.query-repository';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
    private readonly likeService: LikesService,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) { }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() dto: CreatePostInputDto) {
    const postId: string = await this.postsService.createPost(dto);
    return await this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put('/:id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async likePost(
    @Param('id') postId: string,
    @Body() likeStatus: LikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return this.likeService.setPostLikeStatus(postId, likeStatus, user.id);
  }


  @Get('/:id/comments')
  @UseGuards(JwtOptionalGuard)
  async getAllCommentsForPost(
    @Param('id') id: string,
    @Query() query: GetCommentsQueryParams,
    @ExtractUserFromRequest() user: UserContextDto | null
  ) {
    await this.postsQueryRepository.getByIdOrNotFoundFail(id);
    const userId = user?.id || undefined;
    return this.commentsQueryRepository.getAllCommentsForPost(id, query, userId);
  }

  @Post('/:id/comments')
  @UseGuards(JwtAuthGuard)
  async createCommentForPost(
    @Param('id') postId: string,
    @Body() createCommentInputDto: CreateCommentInputDto,
    @ExtractUserFromRequest() user: UserContextDto
  ): Promise<CommentViewDto> {
    await this.postsQueryRepository.getByIdOrNotFoundFail(postId);
    const userInfo = await this.usersService.getUserByIdOrNotFound(user.id);

    const comment = await this.commentsService.createCommentForPost({
      postId,
      content: createCommentInputDto.content,
      userId: user.id,
      userLogin: userInfo.login
    });

    return CommentViewDto.mapToView(comment, user.id, 'None');
  }

  @Get()
  @UseGuards(JwtOptionalGuard)
  async getAll(
    @Query() query: GetPostsQueryParams,
    @Req() req: any,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const currentUserId = req.user?.id;
    return this.postsQueryRepository.getAll(query, currentUserId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalGuard)
  async getById(
    @Param('id') id: string,
    @Req() req: any
  ) {
    // Extract user ID if present in the request (set by optional auth middleware)
    const currentUserId = req.user?.id;
    return await this.postsQueryRepository.getByIdOrNotFoundFail(id, currentUserId);
  }

  @Put(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostInputDto) {
    await this.postsService.updatePost(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async deletePost(@Param('id') id: string) {
    await this.postsService.deletePost(id);
  }
}
