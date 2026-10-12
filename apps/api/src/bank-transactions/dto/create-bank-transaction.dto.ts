import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

const optionalTrimmedString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() || undefined : value;

export class CreateBankTransactionDto {
  @IsUUID()
  bankAccountId!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(1000)
  @Matches(/\S/u, { message: "description must contain at least one non-whitespace character" })
  description!: string;

  @IsString()
  @Matches(/^-?(?:[1-9]\d*)$/u, {
    message: "amountMinorUnits must be a non-zero integer string",
  })
  amountMinorUnits!: string;

  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/\S/u, { message: "reference must contain at least one non-whitespace character" })
  reference?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, {
    message: "transactionDate must use YYYY-MM-DD format",
  })
  transactionDate!: string;
}
