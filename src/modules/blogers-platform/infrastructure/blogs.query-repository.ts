import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogViewDto } from '../api/view-dto/blog.view-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { SortDirection } from '../../../core/dto/base.query-params.input-dto';
import {
  BlogsSortBy,
  GetBlogsQueryParams,
} from '../api/blogs/get-blogs-query-params.input-dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: FilterQuery<BlogDocument> = {
      deletedAt: null,
    };
    if (query.searchNameTerm) {
      filter.name = {
        $regex: query.searchNameTerm,
        $options: 'i',
      };
    }
    const sortField = query.sortBy || BlogsSortBy.CreatedAt;
    const sortDirection = query.sortDirection === SortDirection.Asc ? 1 : -1;

    const [blogs, totalCount] = await Promise.all([
      this.BlogModel.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip((query.pageNumber - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean()
        .exec(),
      this.BlogModel.countDocuments(filter),
    ]);
    const items = blogs.map((blog: BlogDocument) =>
      BlogViewDto.mapToView(blog),
    );
    console.log(query.pageNumber, query.pageSize, totalCount);
    return PaginatedViewDto.mapToView({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items,
    });
  }
}
