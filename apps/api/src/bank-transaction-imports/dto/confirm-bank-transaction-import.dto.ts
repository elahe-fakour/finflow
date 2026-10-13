import { IsUUID } from "class-validator";

export class ConfirmBankTransactionImportDto {
  @IsUUID()
  previewToken!: string;
}
