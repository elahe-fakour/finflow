import { Transform } from "class-transformer";
import { IsDateString, IsOptional, IsString, IsUUID, Max, Min, MaxLength } from "class-validator";

export class ListAuditEventsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actor?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @Transform(({ value }) => parseInteger(value, 1))
  @Min(1)
  page = 1;

  @Transform(({ value }) => parseInteger(value, 25))
  @Min(1)
  @Max(100)
  pageSize = 25;

  @IsOptional()
  @IsDateString()
  to?: string;
}

function parseInteger(value: unknown, fallback: number): unknown {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/u.test(value)) return value;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
}
