import { BaseQueryParams } from "../../../../core/dto/base.query-params.input-dto";

export class GetCommentsQueryParams extends BaseQueryParams {
    sortBy?: CommentSortBy
}

export enum CommentSortBy {
    createdAt = 'createdAt',
    likesCount = 'likesCount',
    dislikesCount = 'dislikesCount',
}