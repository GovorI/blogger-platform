import { CreateBlogDto } from '../../../dto/create-blog.dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateBlogCommand {
  constructor(
    public id: string,
    public dto: CreateBlogDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private blogsRepository: BlogsRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(command.id);
    blog.name = command.dto.name;
    blog.description = command.dto.description;
    blog.websiteUrl = command.dto.websiteUrl;
    await this.blogsRepository.save(blog);
  }
}
