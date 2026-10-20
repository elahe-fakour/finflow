import { Transform } from "class-transformer";
import { Max, Min } from "class-validator";

export class ListAuditEventsDto {
  @Transform(({ value }) => parseInteger(value, 1))
  @Min(1)
  page = 1;

  @Transform(({ value }) => parseInteger(value, 25))
  @Min(1)
  @Max(100)
  pageSize = 25;
}

function parseInteger(value: unknown, fallback: number): unknown {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/u.test(value)) return value;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
}
