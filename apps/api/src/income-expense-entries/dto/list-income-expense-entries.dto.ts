import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsUUID, Matches, Max, Min } from "class-validator";
import { IncomeExpenseType } from "../../generated/prisma/client.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

export class ListIncomeExpenseEntriesDto {
  @IsOptional()
  @IsEnum(IncomeExpenseType)
  type?: IncomeExpenseType;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "from must use YYYY-MM-DD format" })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "to must use YYYY-MM-DD format" })
  to?: string;

  @Transform(({ value }) => parsePaginationValue(value, DEFAULT_PAGE))
  @Min(1)
  page: number = DEFAULT_PAGE;

  @Transform(({ value }) => parsePaginationValue(value, DEFAULT_PAGE_SIZE))
  @Min(1)
  @Max(100)
  pageSize: number = DEFAULT_PAGE_SIZE;
}

function parsePaginationValue(value: unknown, defaultValue: number): unknown {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/u.test(value)) {
    return value;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) ? parsedValue : value;
}
