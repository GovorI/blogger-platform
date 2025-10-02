import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs/blogs.controller';
import { BlogsQueryRepository } from './infrastructure/blogs.query-repository';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.entity';
import { PostsRepository } from './infrastructure/posts.repository';
import { Post, PostSchema } from './domain/post.entity';
import { PostsQueryRepository } from './infrastructure/posts.query-repository';
import { PostsController } from './api/posts/posts.controller';
import { CommentsController } from './api/comments/comments.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Comment, CommentSchema } from './domain/comment.entity';
import { CommentRepository } from './infrastructure/comment.repository';
import { CommentsQueryRepository } from './infrastructure/comment.query-repository';
import { LikesRepository } from './infrastructure/likesRepository';
import { LikeStatusPost, LikeStatusPostSchema } from './domain/likeStatusPost';
import {
  LikeStatusComment,
  LikeStatusCommentSchema,
} from './domain/likeStatusComment';
import { CreateBlogUseCase } from './application/use-cases/blogs/create-blog.use-case';
import { UpdateBlogUseCase } from './application/use-cases/blogs/update-blog.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { DeleteBlogUseCase } from './application/use-cases/blogs/delete-blog.use-case';
import { CreatePostForBlogUseCase } from './application/use-cases/posts/create-post-for-blog.use-case';
import { UpdatePostUseCase } from './application/use-cases/posts/update-post.use-case';
import { DeletePostUseCase } from './application/use-cases/posts/delete-post.use-case';
import { CreateCommentForPostUseCase } from './application/use-cases/comments/create-comment-for-post.use-case';
import { SetLikeStatusForPostUseCase } from './application/use-cases/likes/set-like-status-for-post.use-case';
import { SetLikeStatusForCommentUseCase } from './application/use-cases/likes/set-like-status-for-comment.use-case';
import { UpdateCommentUseCase } from './application/use-cases/comments/update-comment.use-case';
import { DeleteCommentUseCase } from './application/use-cases/comments/delete-comment.use-case';

const useCases = [
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  CreatePostForBlogUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  CreateCommentForPostUseCase,
  SetLikeStatusForPostUseCase,
  SetLikeStatusForCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: LikeStatusPost.name, schema: LikeStatusPostSchema },
      { name: LikeStatusComment.name, schema: LikeStatusCommentSchema },
    ]),
    UserAccountsModule,
    CqrsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsQueryRepository,
    BlogsRepository,
    PostsRepository,
    PostsQueryRepository,
    CommentRepository,
    CommentsQueryRepository,
    LikesRepository,
    ...useCases,
  ],
})
export class BlogersPlatformModule {}
