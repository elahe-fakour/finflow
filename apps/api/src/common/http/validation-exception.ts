import { BadRequestException } from "@nestjs/common";
import type { ValidationError } from "class-validator";
import type { ApiErrorDetail } from "./api-error-response.js";

export function createValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    code: "VALIDATION_FAILED",
    message: "Request validation failed.",
    details: flattenValidationErrors(errors),
  });
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentField?: string,
): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentField === undefined ? error.property : `${parentField}.${error.property}`;
    const messages = error.constraints === undefined ? [] : Object.values(error.constraints);
    const currentError =
      messages.length === 0 ? [] : [{ field, messages } satisfies ApiErrorDetail];

    return [...currentError, ...flattenValidationErrors(error.children ?? [], field)];
  });
}
