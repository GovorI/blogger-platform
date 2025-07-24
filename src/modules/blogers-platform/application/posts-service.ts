import { Injectable } from '@nestjs/common';
import { Post, PostModelType } from '../domain/post.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreatePostInputDto, UpdatePostInputDto } from '../api/input-dto/post.input.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<string> {
    const blog = await this.blogsRepository.findOrNotFoundFail(dto.blogId);

    const post = this.PostModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog._id.toString(),
      blogName: blog.name,
    });
    await this.postsRepository.save(post);
    return post._id.toString();
  }

  async updatePost(id: string, dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.findOrNotFoundFail(id);
    
    if (dto.blogId) {
      const blog = await this.blogsRepository.findOrNotFoundFail(dto.blogId);
      post.blogId = blog._id.toString();
      post.blogName = blog.name;
    }
    
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.shortDescription !== undefined) post.shortDescription = dto.shortDescription;
    if (dto.content !== undefined) post.content = dto.content;
    
    await this.postsRepository.save(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.postsRepository.findOrNotFoundFail(id);
    post.makeDeleted();
    await this.postsRepository.save(post);
  }
}
