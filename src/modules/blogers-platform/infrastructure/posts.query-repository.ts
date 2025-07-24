import { Injectable, NotFoundException } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '../api/posts/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostViewDto } from '../api/view-dto/post.view-dto';
import { SortDirection } from '../../../core/dto/base.query-params.input-dto';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async getPostsForBlog(
    blogId: string,
    query: GetPostsQueryParams,
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
    const items = posts.map((post: PostDocument) => {
      return PostViewDto.mapToView(post);
    });
    return PaginatedViewDto.mapToView({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items,
    });
  }

  async getAll(
    query: GetPostsQueryParams,
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
    const items = posts.map((post: PostDocument) => {
      return PostViewDto.mapToView(post);
    });
    return PaginatedViewDto.mapToView({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items,
    });
  }

  async getByIdOrNotFoundFail(id: string) {
    const post = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return PostViewDto.mapToView(post);
  }
}
