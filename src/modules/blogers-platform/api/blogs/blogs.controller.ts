import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Delete,
  Query,
  Put,
  HttpCode,
} from '@nestjs/common';
import { BadRequestException } from '../../../../core/domain/domain.exception';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BlogsService } from '../../application/blogs-service';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../input-dto/blog.input-dto';
import { BlogsQueryRepository } from '../../infrastructure/blogs.query-repository';
import { GetBlogsQueryParams } from './get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../view-dto/blog.view-dto';
import { PostsService } from '../../application/posts-service';
import { CreatePostInputDto } from '../input-dto/post.input.dto';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { GetPostsQueryParams } from '../posts/get-posts-query-params.input-dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly blogsQueryRepo: BlogsQueryRepository,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new blog' })
  @ApiBody({ type: CreateBlogInputDto })
  @ApiResponse({
    status: 201,
    description: 'Blog created successfully',
    type: BlogViewDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBlog(@Body() dto: CreateBlogInputDto) {
    const blogId: string = await this.blogsService.createBlog(dto);
    return await this.blogsQueryRepo.getByIdOrNotFoundFail(blogId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog by ID' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({
    status: 200,
    description: 'Blog found',
    type: BlogViewDto,
  })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async getById(@Param('id') id: string) {
    return await this.blogsQueryRepo.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Update blog by ID' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiBody({ type: UpdateBlogInputDto })
  @ApiResponse({ status: 204, description: 'Blog updated successfully' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateBlog(@Param('id') id: string, @Body() dto: UpdateBlogInputDto) {
    await this.blogsService.updateBlog(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blogs with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of blogs with pagination',
  })
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.blogsQueryRepo.getAll(query);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete blog by ID' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({ status: 204, description: 'Blog deleted successfully' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async deleteById(@Param('id') id: string) {
    return this.blogsService.deleteBlogById(id);
  }

  @Post(':id/posts')
  async createPostForBlog(
    @Param('id') id: string,
    @Body() post: CreatePostInputDto,
  ) {
    if (!id) throw new BadRequestException('Blog ID is required');
    post.blogId = id;
    const postId: string = await this.postsService.createPost(post);
    return await this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get(':id/posts')
  async getPostsForBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
  ) {
    await this.blogsQueryRepo.getByIdOrNotFoundFail(id);
    return this.postsQueryRepository.getPostsForBlog(id, query);
  }
}
