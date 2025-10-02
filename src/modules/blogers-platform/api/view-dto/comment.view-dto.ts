import { CommentDocument } from '../../domain/comment.entity';

/**
 * Commentator information
 */
class CommentatorInfo {
  /** User ID who created the comment */
  userId: string;

  /** User login who created the comment */
  userLogin: string;
}

/**
 * Likes information for comments
 */
class LikesInfo {
  /** Number of likes */
  likesCount: number;

  /** Number of dislikes */
  dislikesCount: number;

  /** Current user like status: 'Like', 'Dislike', or 'None' */
  myStatus: 'Like' | 'Dislike' | 'None';
}

/**
 * Comment view data transfer object
 */
export class CommentViewDto {
  /** Comment ID */
  id: string;

  /** Comment content */
  content: string;

  /** Commentator information */
  commentatorInfo: CommentatorInfo;

  /** Comment creation date */
  createdAt: Date;

  /** Likes information */
  likesInfo: LikesInfo;

  static mapToView(
    comment: CommentDocument,
    currentUserId?: string | null,
    myStatus?: string,
  ): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    };
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.LikesInfo.likesCount,
      dislikesCount: comment.LikesInfo.dislikesCount,
      myStatus: (currentUserId ? myStatus || 'None' : 'None') as
        | 'Like'
        | 'Dislike'
        | 'None',
    };
    return dto;
  }
}
