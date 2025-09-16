import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) { }

  async save(post: PostDocument) {
    await post.save();
  }

  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.PostModel.findById(id);
    if (!post || post.deletedAt !== null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return post;
  }
}
