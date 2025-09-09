import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { UserViewDto } from '../api/view-dto/user.view-dto';
import {
  UnauthorizedException as DomainUnauthorizedException,
  UserNotFoundException,
} from '../../../core/domain/domain.exception';
import { GetUsersQueryParams } from '../api/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { SortDirection } from '../../../core/dto/base.query-params.input-dto';

export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    return UserViewDto.mapToView(user);
  }

  async getMe(id: string) {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!user) {
      throw new DomainUnauthorizedException();
    }
    return {
      email: user.email,
      login: user.login,
      userId: user._id.toString(),
    };
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const filter: FilterQuery<UserDocument> = {
      deletedAt: null,
    };
    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortDirection === SortDirection.Asc ? 1 : -1;

    if (query.searchLoginTerm || query.searchEmailTerm) {
      const orConditions: FilterQuery<UserDocument>[] = [];

      if (query.searchLoginTerm) {
        orConditions.push({
          login: { $regex: query.searchLoginTerm, $options: 'i' },
        });
      }

      if (query.searchEmailTerm) {
        orConditions.push({
          email: { $regex: query.searchEmailTerm, $options: 'i' },
        });
      }
      filter.$or = orConditions;
    }
    const [users, totalCount] = await Promise.all([
      this.UserModel.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip((query.pageNumber - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean()
        .exec(),
      this.UserModel.countDocuments(filter),
    ]);
    const items = users.map((user: UserDocument) =>
      UserViewDto.mapToView(user),
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
