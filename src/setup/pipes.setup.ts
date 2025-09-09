import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Extension } from '../core/exceptions/domain-exceptions';
import { ValidationException } from '../core/domain/domain.exception';

//функция использует рекурсию для обхода объекта children при вложенных полях при валидации
//поставьте логи и разберитесь как она работает
//TODO: tests
export const errorFormatter = (
  errors: ValidationError[],
  errorMessage?: any,
): Extension[] => {
  const errorsForResponse = errorMessage || [];

  for (const error of errors) {
    if (!error.constraints && error.children?.length) {
      errorFormatter(error.children, errorsForResponse);
    } else if (error.constraints) {
      const constrainKeys = Object.keys(error.constraints);

      for (const key of constrainKeys) {
        const errorMsg = new Extension(
          error.constraints[key]
            ? `${error.constraints[key]}; Received value: ${error?.value}`
            : '',
          error.property,
        );
        errorsForResponse.push(errorMsg);
      }
    }
  }

  return errorsForResponse;
};

export function pipesSetup(app: INestApplication) {
  //Глобальный пайп для валидации и трансформации входящих данных.
  //На следующем занятии рассмотрим подробнее
  app.useGlobalPipes(
    new ValidationPipe({
      //class-transformer создает экземпляр dto
      //соответственно применятся значения по-умолчанию
      //и методы классов dto
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const formattedErrors = errorFormatter(errors);
        throw new ValidationException('Validation failed', formattedErrors);
      },
    }),
  );
}
