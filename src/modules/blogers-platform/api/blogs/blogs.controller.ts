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
import { BadRequestException } from '../../../../core/domain/domain.exception';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateBlogInputDto,
  UpdateBlogInputDto,
} from '../input-dto/blog.input-dto';
import { BlogsQueryRepository } from '../../infrastructure/blogs.query-repository';
import { GetBlogsQueryParams } from './get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../view-dto/blog.view-dto';
import {
  CreatePostForBlogInputDto,
  CreatePostInputDto,
} from '../input-dto/post.input.dto';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { GetPostsQueryParams } from '../posts/get-posts-query-params.input-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtOptionalGuard } from '../../../user-accounts/guards/bearer/jwt-optional.guard';
import { CreateBlogCommand } from '../../application/use-cases/blogs/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateBlogCommand } from '../../application/use-cases/blogs/update-blog.use-case';
import { DeleteBlogCommand } from '../../application/use-cases/blogs/delete-blog.use-case';
import { PostViewDto } from '../view-dto/post.view-dto';
import { JwtPayload } from '../../../user-accounts/domain/jwt-payload.interface';
import { CreatePostForBlogCommand } from '../../application/use-cases/posts/create-post-for-blog.use-case';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Create a new blog' })
  @ApiBody({ type: CreateBlogInputDto })
  @ApiResponse({
    status: 201,
    description: 'Blog created successfully',
    type: BlogViewDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBlog(@Body() dto: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId: string = await this.commandBus.execute(
      new CreateBlogCommand(dto),
    );
    return this.blogsQueryRepo.getByIdOrNotFoundFail(blogId);
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
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepo.getByIdOrNotFoundFail(id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Update blog by ID' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiBody({ type: UpdateBlogInputDto })
  @ApiResponse({ status: 204, description: 'Blog updated successfully' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateBlog(
    @Param('id') id: string,
    @Body() dto: UpdateBlogInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand(id, dto));
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
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete blog by ID' })
  @ApiParam({ name: 'id', description: 'Blog ID' })
  @ApiResponse({ status: 204, description: 'Blog deleted successfully' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async deleteById(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand(id));
  }

  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostForBlog(
    @Param('id') id: string,
    @Body() postData: CreatePostForBlogInputDto,
  ): Promise<PostViewDto> {
    if (!id) throw new BadRequestException('Blog ID is required');

    const createPostDto: CreatePostInputDto = {
      ...postData,
      blogId: id,
    };

    const postId: string = await this.commandBus.execute(
      new CreatePostForBlogCommand(createPostDto),
    );
    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Get(':id/posts')
  @UseGuards(JwtOptionalGuard)
  async getPostsForBlog(
    @Param('id') id: string,
    @Query() query: GetPostsQueryParams,
    @Req() req: Request & { user?: JwtPayload },
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    await this.blogsQueryRepo.getByIdOrNotFoundFail(id);
    const currentUserId = req.user?.sub;
    return this.postsQueryRepository.getPostsForBlog(id, query, currentUserId);
  }
}
