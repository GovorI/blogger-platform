import { Module } from '@nestjs/common';
import { BlogsService } from './application/blogs-service';
import { BlogsController } from './api/blogs/blogs.controller';
import { BlogsQueryRepository } from './infrastructure/blogs.query-repository';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.entity';
import { PostsService } from './application/posts-service';
import { PostsRepository } from './infrastructure/posts.repository';
import { Post, PostSchema } from './domain/post.entity';
import { PostsQueryRepository } from './infrastructure/posts.query-repository';
import { PostsController } from './api/posts/posts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [BlogsController, PostsController],
  providers: [
    BlogsService,
    BlogsQueryRepository,
    BlogsRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
  ],
})
export class BlogersPlatformModule {}
