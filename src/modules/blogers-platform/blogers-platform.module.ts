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
import { CommentsController } from './api/comments/comments.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Comment, CommentSchema } from './domain/comment.entity';
import { CommentRepository } from './infrastructure/comment.repository';
import { CommentsQueryRepository } from './infrastructure/comment.query-repository';
import { CommentsService } from './application/comment-service';
import { LikesService } from './application/like-service';
import { LikesRepository } from './infrastructure/likesRepository';
import { LikeStatusPost, LikeStatusPostSchema } from './domain/likeStatusPost';
import { LikeStatusComment, LikeStatusCommentSchema } from './domain/likeStatusComment';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: LikeStatusPost.name, schema: LikeStatusPostSchema },
      { name: LikeStatusComment.name, schema: LikeStatusCommentSchema },
    ]),
    UserAccountsModule
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsQueryRepository,
    BlogsRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    CommentsService,
    CommentRepository,
    CommentsQueryRepository,
    LikesService,
    LikesRepository,
  ],
})
export class BlogersPlatformModule { }
