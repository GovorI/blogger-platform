import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { swaggerSetup } from './swagger.setup';
import { enableCorsSetup } from './enable-cors.setup';

export function appSetup(app: INestApplication) {
  enableCorsSetup(app);
  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app);
}
