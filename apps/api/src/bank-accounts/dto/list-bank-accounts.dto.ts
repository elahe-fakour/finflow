import { IsEnum, IsOptional } from "class-validator";
import { BankAccountStatus } from "../../generated/prisma/client.js";

export class ListBankAccountsDto {
  @IsOptional()
  @IsEnum(BankAccountStatus)
  status?: BankAccountStatus;
}
