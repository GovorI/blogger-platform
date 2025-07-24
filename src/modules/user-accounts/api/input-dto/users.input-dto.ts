import { CreateUserDto } from '../../dto/create-user.dto';

export class CreateUserInputDto implements CreateUserDto {
  login: string;
  password: string;
  email: string;
}