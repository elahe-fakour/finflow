import { Transform } from "class-transformer";
import { Equals, IsEnum, IsString, IsUUID, Matches, MaxLength, ValidateIf } from "class-validator";
import { IncomeExpenseType } from "../../generated/prisma/client.js";

export class UpdateIncomeExpenseEntryDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsEnum(IncomeExpenseType)
  type?: IncomeExpenseType;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9]\d*$/u, { message: "amountMinorUnits must be a positive integer string" })
  amountMinorUnits?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Equals("USD", { message: "currency must be USD" })
  currency?: "USD";

  @ValidateIf((_, value: unknown) => value !== undefined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "occurredOn must use YYYY-MM-DD format" })
  occurredOn?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(1000)
  @Matches(/\S/u, { message: "description must contain at least one non-whitespace character" })
  description?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsUUID()
  categoryId?: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID()
  vendorId?: string | null;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() || null : value))
  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(100)
  reference?: string | null;
}
