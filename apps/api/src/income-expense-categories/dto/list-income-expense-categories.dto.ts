import { IsEnum, IsOptional } from "class-validator";
import { IncomeExpenseType } from "../../generated/prisma/client.js";

export class ListIncomeExpenseCategoriesDto {
  @IsOptional()
  @IsEnum(IncomeExpenseType)
  type?: IncomeExpenseType;
}
