import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsUUID, Matches, Max, Min } from "class-validator";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

export enum BankTransactionDirection {
  INFLOW = "INFLOW",
  OUTFLOW = "OUTFLOW",
}

export class ListBankTransactionsDto {
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @IsOptional()
  @IsEnum(BankTransactionDirection)
  direction?: BankTransactionDirection;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "from must use YYYY-MM-DD format" })
  from?: string;

  @Transform(({ value }) => parsePaginationValue(value, DEFAULT_PAGE))
  @Min(1)
  page: number = DEFAULT_PAGE;

  @Transform(({ value }) => parsePaginationValue(value, DEFAULT_PAGE_SIZE))
  @Min(1)
  @Max(100)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() || undefined : value))
  @IsOptional()
  @Matches(/^[\s\S]{1,100}$/u, { message: "q must be 100 characters or fewer" })
  q?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "to must use YYYY-MM-DD format" })
  to?: string;
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
