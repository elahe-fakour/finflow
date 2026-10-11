import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { BankAccountStatus } from "../../generated/prisma/client.js";

const optionalTrimmedString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() || null : value;

export class UpdateBankAccountDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/\S/u, { message: "name must contain at least one non-whitespace character" })
  name?: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/\S/u, { message: "institutionName must contain at least one non-whitespace character" })
  institutionName?: string | null;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @Matches(/^\d{4}$/u, { message: "accountLastFour must contain exactly four digits" })
  accountLastFour?: string | null;

  @IsOptional()
  @IsEnum(BankAccountStatus)
  status?: BankAccountStatus;
}
