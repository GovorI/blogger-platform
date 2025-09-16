import { Injectable } from '@nestjs/common';
import { PostNotFoundException } from '../../../core/domain/domain.exception';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '../api/posts/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { SortDirection } from '../../../core/dto/base.query-params.input-dto';
import { LikeStatusPost, LikeStatusPostModelType } from '../domain/likeStatusPost';
import { LikeStatuses } from '../domain/base-like.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    @InjectModel(LikeStatusPost.name) private LikeStatusPostModel: LikeStatusPostModelType
  ) { }

  async getPostsForBlog(
    blogId: string,
    query: GetPostsQueryParams,
    currentUserId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter = { blogId: blogId };
    const sortBy = query.sortBy || PostsSortBy.CreatedAt;
    const sortDirection = query.sortDirection === SortDirection.Asc ? 1 : -1;

    const [posts, totalCount] = await Promise.all([
      this.PostModel.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip((query.pageNumber - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean()
        .exec(),
      this.PostModel.countDocuments(filter),
    ]);

    const items = await Promise.all(posts.map(async (post: PostDocument) => {
      if (currentUserId) {
        const userLike = await this.LikeStatusPostModel.findOne({
          postId: post._id.toString(),
          userId: currentUserId
        });
        post.extendedLikesInfo.myStatus = userLike ? userLike.status : LikeStatuses.None;
      } else {
        post.extendedLikesInfo.myStatus = LikeStatuses.None;
      }
      return PostViewDto.mapToView(post, currentUserId);
    }));

    return PaginatedViewDto.mapToView({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items,
    });
  }

  async getAll(
    query: GetPostsQueryParams,
    currentUserId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter = { deletedAt: null };
    const sortBy = query.sortBy || PostsSortBy.CreatedAt;
    const sortDirection = query.sortDirection === SortDirection.Asc ? 1 : -1;

    const [posts, totalCount] = await Promise.all([
      this.PostModel.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip((query.pageNumber - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean()
        .exec(),
      this.PostModel.countDocuments(filter),
    ]);

    const items = await Promise.all(posts.map(async (post: PostDocument) => {
      if (currentUserId) {
        const userLike = await this.LikeStatusPostModel.findOne({
          postId: post._id.toString(),
          userId: currentUserId
        });
        post.extendedLikesInfo.myStatus = userLike ? userLike.status : LikeStatuses.None;
      } else {
        post.extendedLikesInfo.myStatus = LikeStatuses.None;
      }
      return PostViewDto.mapToView(post, currentUserId);
    }));

    return PaginatedViewDto.mapToView({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items,
    });
  }

  async getByIdOrNotFoundFail(id: string, currentUserId?: string) {
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new PostNotFoundException('Post not found');
    }

    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!post) {
      throw new PostNotFoundException('Post not found');
    }

    // Set the user's like status if authenticated
    if (currentUserId) {
      const userLike = await this.LikeStatusPostModel.findOne({
        postId: id,
        userId: currentUserId
      });
      post.extendedLikesInfo.myStatus = userLike ? userLike.status : LikeStatuses.None;
    } else {
      post.extendedLikesInfo.myStatus = LikeStatuses.None;
    }

    return PostViewDto.mapToView(post, currentUserId);
  }
}
