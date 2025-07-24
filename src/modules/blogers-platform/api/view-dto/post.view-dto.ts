import { PostDocument } from '../../domain/post.entity';

/**
 * Extended likes information for posts
 */
class ExtendedLikesInfo {
  /** Number of dislikes */
  dislikesCount: number;

  /** Number of likes */
  likesCount: number;

  /** Current user like status: 'Like', 'Dislike', or 'None' */
  myStatus: 'Like' | 'Dislike' | 'None';

  /** Three newest likes */
  newestLikes: any[];
}

/**
 * Post view data transfer object
 */
export class PostViewDto {
  /** Post ID */
  id: string;

  /** Post title */
  title: string;

  /** Short description of the post */
  shortDescription: string;

  /** Post content */
  content: string;

  /** Blog ID that contains this post */
  blogId: string;

  /** Blog name that contains this post */
  blogName: string;

  /** Post creation date */
  createdAt: Date;

  /** Extended likes information */
  extendedLikesInfo: ExtendedLikesInfo;

  static mapToView(post: PostDocument): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt;
    dto.extendedLikesInfo = {
      dislikesCount: 0,
      likesCount: 0,
      myStatus: 'None',
      newestLikes: [],
    };
    return dto;
  }
}
