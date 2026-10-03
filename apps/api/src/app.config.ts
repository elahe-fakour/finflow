import {
  NotFoundException,
  ValidationPipe,
  VersioningType,
  type INestApplication,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ApiExceptionFilter, createApiErrorResponse } from "./common/http/api-exception.filter.js";
import type { ApiErrorResponse } from "./common/http/api-error-response.js";
import { createValidationException } from "./common/http/validation-exception.js";

const API_PREFIX = "api";
const API_VERSION = "1";

/**
 * Applies the HTTP conventions shared by every FinFlow API endpoint.
 *
 * Keeping this configuration separate from `main.ts` lets HTTP integration tests
 * exercise the same pipeline as the running application.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: createValidationException,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter(app.get(HttpAdapterHost)));
}

/**
 * Registers the final Express handler after Nest has registered controller
 * routes. Nest does not pass unmatched routes through exception filters, so
 * this handler preserves the same JSON error contract for 404 responses.
 */
export function configureNotFoundHandler(app: INestApplication): void {
  app.use((request: UnmatchedRequest, response: UnmatchedResponse) => {
    const path = request.originalUrl ?? request.url ?? "/";
    const exception = new NotFoundException(`Cannot ${request.method} ${path}`);
    const errorResponse = createApiErrorResponse(exception, exception.getStatus(), path);

    response.status(exception.getStatus()).json(errorResponse);
  });
}

type UnmatchedRequest = {
  method: string;
  originalUrl?: string;
  url?: string;
};

type UnmatchedResponse = {
  status(statusCode: number): {
    json(body: ApiErrorResponse): void;
  };
};
