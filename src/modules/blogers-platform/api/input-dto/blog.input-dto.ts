import { CreateBlogDto } from '../../dto/create-blog.dto';
import { UpdateBlogDto } from '../../dto/update-blog.dto';

/**
 * Data transfer object for creating a new blog
 */
export class CreateBlogInputDto implements CreateBlogDto {
  /** Blog name (max 15 characters) */
  name: string;

  /** Blog description (max 500 characters) */
  description: string;

  /** Blog website URL (max 100 characters) */
  websiteUrl: string;
}

/**
 * Data transfer object for updating an existing blog
 */
export class UpdateBlogInputDto implements UpdateBlogDto {
  /** Blog name (max 15 characters) */
  name: string;

  /** Blog description (max 500 characters) */
  description: string;

  /** Blog website URL (max 100 characters) */
  websiteUrl: string;
}
