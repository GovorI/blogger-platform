/**
 * Data transfer object for creating a new post
 */
export class CreatePostInputDto {
  /** Post title (max 30 characters) */
  title: string;

  /** Short description of the post (max 100 characters) */
  shortDescription: string;

  /** Post content (max 1000 characters) */
  content: string;

  /** Blog ID that will contain this post */
  blogId: string;
}

/**
 * Data transfer object for updating an existing post
 */
export class UpdatePostInputDto {
  /** Post title (max 30 characters) */
  title?: string;

  /** Short description of the post (max 100 characters) */
  shortDescription?: string;

  /** Post content (max 1000 characters) */
  content?: string;

  /** Blog ID that will contain this post */
  blogId?: string;
}
