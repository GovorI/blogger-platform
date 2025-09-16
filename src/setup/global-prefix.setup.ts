import { INestApplication } from '@nestjs/common';
import { CoreConfig } from '../core/core.config';

export function globalPrefixSetup(app: INestApplication) {
  const coreConfig = app.get<CoreConfig>(CoreConfig);
  //специальный метод, который добавляет ко всем маршрутам /GLOBAL_PREFIX
  app.setGlobalPrefix(coreConfig.globalPrefix);
}
