import { Injectable } from '@nestjs/common';
import { BadRequestException, UserNotFoundException } from '../../../core/domain/domain.exception';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { CryptoService } from './crypto-service';

@Injectable()
export class UsersService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private bcryptService: CryptoService,
  ) { }

  async createUser(dto: CreateUserDto): Promise<string> {
    const [existingUserByLogin, existingUserByEmail] = await Promise.all([
      this.usersRepository.getUserByLogin(dto.login),
      this.usersRepository.getUserByEmail(dto.email),
    ]);
    if (existingUserByLogin) {
      throw new BadRequestException('Login already exists');
    }
    if (existingUserByEmail) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash: string = await this.bcryptService.createPassHash(
      dto.password,
    );

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      password: passwordHash,
    });

    // Admin-created users don't require email confirmation
    user.isEmailConfirmed = true;
    user.confirmCode = null;
    user.expirationCode = null;

    await this.usersRepository.save(user);
    return user._id.toString();
  }

  // async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
  //   const user = await this.usersRepository.findOrNotFoundFail(id);
  //
  //   user.update(dto);
  //
  //   await this.usersRepository.save(user);
  //
  //   return user._id.toString();
  // }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }

  async getUserByIdOrNotFound(id: string): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id)
    if (!user) {
      throw new UserNotFoundException
    }
    return user
  }
}
