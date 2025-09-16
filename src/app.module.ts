import { configModule } from './dynamic-config-module';
import { Module, DynamicModule } from '@nestjs/common';
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
import { ConfigService } from '@nestjs/config';

// Dynamic module imports based on environment
function getModuleImports(): any[] {
  const configService = new ConfigService() as ConfigService<any, true>;
  const coreConfig = new CoreConfig(configService);

  const baseModules = [
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({
        uri: coreConfig.mongoURI,
      }),
      inject: [CoreConfig],
    }),
    UserAccountsModule,
    BlogersPlatformModule,
    NotificationsModule,
    JwtAuthModule,
    configModule,
    CoreModule,
  ];

  // Add TestingModule only in testing or development environment
  if (coreConfig.includeTestingModule) {
    baseModules.push(TestingModule);
  }

  return baseModules;
}

@Module({
  imports: getModuleImports(),
  controllers: [AppController],
  providers: [AppService, CoreConfig],
})
export class AppModule { }
