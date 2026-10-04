import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { STATUS_CODES } from "node:http";
import type { ApiErrorDetail, ApiErrorResponse } from "./api-error-response.js";

type ExceptionResponse = Record<string, unknown>;

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const statusCode = getStatusCode(exception);
    const response = createApiErrorResponse(
      exception,
      statusCode,
      this.httpAdapterHost.httpAdapter.getRequestUrl(httpContext.getRequest()),
    );

    this.httpAdapterHost.httpAdapter.reply(httpContext.getResponse(), response, statusCode);
  }
}

function getStatusCode(exception: unknown): number {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

export function createApiErrorResponse(
  exception: unknown,
  statusCode: number,
  path: string,
): ApiErrorResponse {
  const fallbackMessage = STATUS_CODES[statusCode] ?? "Internal Server Error";
  const exceptionResponse = getExceptionResponse(exception);
  const details = getErrorDetails(exceptionResponse?.details);

  return {
    statusCode,
    error: getString(exceptionResponse?.error) ?? fallbackMessage,
    code: getString(exceptionResponse?.code) ?? getFallbackErrorCode(statusCode),
    message: getString(exceptionResponse?.message) ?? fallbackMessage,
    ...(details === undefined ? {} : { details }),
    path,
    timestamp: new Date().toISOString(),
  };
}

function getFallbackErrorCode(statusCode: number): string {
  return statusCode === HttpStatus.UNAUTHORIZED ? "UNAUTHENTICATED" : `HTTP_${statusCode}`;
}

function getExceptionResponse(exception: unknown): ExceptionResponse | undefined {
  if (!(exception instanceof HttpException)) {
    return undefined;
  }

  const response = exception.getResponse();

  if (typeof response === "string") {
    return { message: response };
  }

  return isRecord(response) ? response : undefined;
}

function getErrorDetails(value: unknown): ApiErrorDetail[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details = value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const field = getString(item.field);
    const messages = Array.isArray(item.messages)
      ? item.messages.filter((message): message is string => typeof message === "string")
      : [];

    return field === undefined || messages.length === 0 ? [] : [{ field, messages }];
  });

  return details.length === 0 ? undefined : details;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is ExceptionResponse {
  return typeof value === "object" && value !== null;
}
