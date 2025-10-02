import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostInputDto } from '../../../api/input-dto/post.input.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../../domain/post.entity';
import { PostsRepository } from '../../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class CreatePostForBlogCommand {
  constructor(public postData: CreatePostInputDto) {}
}

@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogUseCase
  implements ICommandHandler<CreatePostForBlogCommand>
{
  constructor(
    @InjectModel(Post.name) private PostModel: PostModelType,
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute(command: CreatePostForBlogCommand): Promise<string> {
    const blog = await this.blogsRepository.findOrNotFoundFail(
      command.postData.blogId,
    );

    const post = this.PostModel.createInstance({
      title: command.postData.title,
      shortDescription: command.postData.shortDescription,
      content: command.postData.content,
      blogId: blog._id.toString(),
      blogName: blog.name,
    });
    await this.postsRepository.save(post);
    return post._id.toString();
  }
}
