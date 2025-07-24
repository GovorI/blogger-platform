import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BlogersPlatformModule } from './modules/blogers-platform/blogers-platform.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/blog-platform-db'),
    UserAccountsModule,
    TestingModule,
    BlogersPlatformModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
