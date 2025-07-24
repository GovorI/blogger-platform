import { BlogDocument } from '../../domain/blog.entity';

/**
 * Blog view data transfer object
 */
export class BlogViewDto {
  /** Blog ID */
  id: string;

  /** Blog name */
  name: string;

  /** Blog description */
  description: string;

  /** Blog website URL */
  websiteUrl: string;

  /** Blog creation date */
  createdAt: Date;

  /** Membership status */
  isMembership: boolean;

  static mapToView(blog: BlogDocument): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = blog._id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;

    return dto;
  }
}
