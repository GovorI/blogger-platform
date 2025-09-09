import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { BlogNotFoundException } from '../../../core/domain/domain.exception';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) { }

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.BlogModel.findById(id);
    if (!blog || blog.deletedAt !== null) {
      throw new BlogNotFoundException('Blog not found');
    }

    return blog;
  }
}
