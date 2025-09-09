import { INestApplication } from '@nestjs/common';
import { DomainHttpExceptionsFilter } from '../core/exceptions/filters/domain-exception.filter';
import { AllHttpExceptionsFilter } from '../core/exceptions/filters/all-exceptions.filter';

export function exceptionsFilterSetup(app: INestApplication) {
  app.useGlobalFilters(
    new AllHttpExceptionsFilter(),
    new DomainHttpExceptionsFilter(),
  );
}
