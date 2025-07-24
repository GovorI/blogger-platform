import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class UsersService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
  ) {}

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

    const passwordHash: string = await this.bcryptService.getHash(dto.password);

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      password: passwordHash,
    });

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
}
