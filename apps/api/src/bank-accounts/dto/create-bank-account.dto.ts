import { Transform } from "class-transformer";
import { Equals, IsEnum, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { BankAccountType } from "../../generated/prisma/client.js";

const optionalTrimmedString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() || undefined : value;

export class CreateBankAccountDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  @Matches(/\S/u, { message: "name must contain at least one non-whitespace character" })
  name!: string;

  @IsEnum(BankAccountType)
  type!: BankAccountType;

  @Equals("USD", { message: "currency must be USD" })
  currency!: "USD";

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/\S/u, { message: "institutionName must contain at least one non-whitespace character" })
  institutionName?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @Matches(/^\d{4}$/u, { message: "accountLastFour must contain exactly four digits" })
  accountLastFour?: string;

  @IsOptional()
  @IsString()
  @Matches(/^-?(?:0|[1-9]\d*)$/u, {
    message: "openingBalanceMinorUnits must be an integer string",
  })
  openingBalanceMinorUnits?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, {
    message: "openingBalanceDate must use YYYY-MM-DD format",
  })
  openingBalanceDate?: string;
}
