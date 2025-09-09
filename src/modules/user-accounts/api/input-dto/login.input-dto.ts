import { IsString, Length } from "class-validator";
import { IsEmailOrUsername } from "../../../../core/decorators/is-email-or-username.decorator";

export class LoginInputDto {
    @IsEmailOrUsername({ message: "Invalid login credentials" })
    loginOrEmail: string;

    @IsString()
    @Length(6, 20)
    password: string;
}