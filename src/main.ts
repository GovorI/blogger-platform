import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { useContainer } from 'class-validator';
import { CoreConfig } from './core/core.config';
import { JwtConfig } from './modules/jwt/jwt.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const coreConfig = app.get<CoreConfig>(CoreConfig);
  const jwtConfig = app.get<JwtConfig>(JwtConfig);
  // Enable DI in class-validator so custom validators can inject services/models
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
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
  // const config = new DocumentBuilder()
  //   .setTitle('Blogger Platform API')
  //   .setDescription('The Blogger Platform API description')
  //   .setVersion('1.0')
  //   .addTag('blogs')
  //   .addTag('posts')
  //   .addTag('users')
  //   .build();
  //
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api/docs', app, document);
  console.log(`App is running on: ${coreConfig.port}`);
  console.log(`accessTokenExpiresIn: ${jwtConfig.accessTokenExpiresIn}`);
  console.log(`refreshTokenExpiresIn: ${jwtConfig.refreshTokenExpiresIn}`);
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
  await app.listen(coreConfig.port);
}

bootstrap();
