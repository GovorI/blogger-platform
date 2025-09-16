import { IsNotEmpty, IsString, IsUrl, Length, MaxLength } from "class-validator";

export class UpdateBlogDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 15)
  name: string;

  /** Blog description (max 500 characters) */
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;

  /** Blog website URL (max 100 characters) */
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(100)
  websiteUrl: string;
}
