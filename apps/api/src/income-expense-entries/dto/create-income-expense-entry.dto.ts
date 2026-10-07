import { Transform } from "class-transformer";
import { Equals, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import { IncomeExpenseType } from "../../generated/prisma/client.js";

export class CreateIncomeExpenseEntryDto {
  @IsEnum(IncomeExpenseType)
  type!: IncomeExpenseType;

  @IsString()
  @Matches(/^[1-9]\d*$/u, { message: "amountMinorUnits must be a positive integer string" })
  amountMinorUnits!: string;

  @Equals("USD", { message: "currency must be USD" })
  currency!: "USD";

  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "occurredOn must use YYYY-MM-DD format" })
  occurredOn!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(1000)
  @Matches(/\S/u, { message: "description must contain at least one non-whitespace character" })
  description!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() || undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
