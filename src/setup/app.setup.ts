import { pipesSetup } from './pipes.setup';
import { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { swaggerSetup } from './swagger.setup';
import { enableCorsSetup } from './enable-cors.setup';
import { exceptionsFilterSetup } from './exceptions-filter.setup';

export function appSetup(app: INestApplication) {
  globalPrefixSetup(app);
  enableCorsSetup(app);
  pipesSetup(app);
  exceptionsFilterSetup(app);
  swaggerSetup(app);
}
