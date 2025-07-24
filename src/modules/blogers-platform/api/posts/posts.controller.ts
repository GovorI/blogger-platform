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

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postsService: PostsService,
  ) {}

  @Post()
  async createBlog(@Body() dto: CreatePostInputDto) {
    const postId: string = await this.postsService.createPost(dto);
    return await this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.postsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.postsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @HttpCode(204)
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostInputDto) {
    await this.postsService.updatePost(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deletePost(@Param('id') id: string) {
    await this.postsService.deletePost(id);
  }
}
