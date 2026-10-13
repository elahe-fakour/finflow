import { IsUUID } from "class-validator";

export class PreviewBankTransactionImportDto {
  @IsUUID()
  bankAccountId!: string;
}
