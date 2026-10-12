import { IsOptional, IsUUID, ValidateIf } from "class-validator";

export class AssignBankTransactionCategoryDto {
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID()
  categoryId?: string | null;
}
