import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';

export class GetPostsQueryParams extends BaseQueryParams {
  sortBy?: PostsSortBy;
}

export enum PostsSortBy {
  Name = 'name',
  Description = 'description',
  CreatedAt = 'createdAt',
}
