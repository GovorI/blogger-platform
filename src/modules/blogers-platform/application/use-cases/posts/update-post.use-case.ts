import { UpdatePostInputDto } from '../../../api/input-dto/post.input.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class UpdatePostCommand {
  constructor(
    public postId: string,
    public dto: UpdatePostInputDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const post = await this.postsRepository.findOrNotFoundFail(command.postId);

    if (command.dto.blogId) {
      const blog = await this.blogsRepository.findOrNotFoundFail(
        command.dto.blogId,
      );
      post.blogId = blog._id.toString();
      post.blogName = blog.name;
    }

    if (command.dto.title !== undefined) post.title = command.dto.title;
    if (command.dto.shortDescription !== undefined)
      post.shortDescription = command.dto.shortDescription;
    if (command.dto.content !== undefined) post.content = command.dto.content;

    await this.postsRepository.save(post);
  }
}
