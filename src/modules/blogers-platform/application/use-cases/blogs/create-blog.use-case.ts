import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../../domain/blog.entity';
import { CreateBlogDto } from '../../../dto/create-blog.dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(public dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const blog = this.BlogModel.createInstance({
      name: command.dto.name,
      description: command.dto.description,
      websiteUrl: command.dto.websiteUrl,
    });
    await this.blogsRepository.save(blog);
    return blog._id.toString();
  }
}
