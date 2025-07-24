import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { appSetup } from './setup/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);
  // app.enableCors();
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     //class-transformer создает экземпляр dto
  //     //соответственно применятся значения по-умолчанию
  //     //сработает наследование
  //     //и методы классов dto
  //     transform: true,
  //   }),
  // );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Blogger Platform API')
    .setDescription('The Blogger Platform API description')
    .setVersion('1.0')
    .addTag('blogs')
    .addTag('posts')
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
//...

bootstrap();
