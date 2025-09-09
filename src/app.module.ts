import { configModule } from './dynamic-config-module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BlogersPlatformModule } from './modules/blogers-platform/blogers-platform.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JwtAuthModule } from './modules/jwt/jwt.module';
import { CoreConfig } from './core/core.config';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    // MongooseModule.forRoot(
    //   process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blog-platform-db',
    // ),
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({
        uri: coreConfig.mongoURI,
      }),
      inject: [CoreConfig],
    }),
    UserAccountsModule,
    TestingModule,
    BlogersPlatformModule,
    NotificationsModule,
    JwtAuthModule,
    configModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [AppService, CoreConfig],
})
export class AppModule {}
