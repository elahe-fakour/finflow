import { Transform } from "class-transformer";
import { IsEnum, IsString, Matches, MaxLength } from "class-validator";
import { IncomeExpenseType } from "../../generated/prisma/client.js";

export class CreateIncomeExpenseCategoryDto {
  @IsEnum(IncomeExpenseType)
  type!: IncomeExpenseType;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  @Matches(/\S/u, { message: "name must contain at least one non-whitespace character" })
  name!: string;
}
