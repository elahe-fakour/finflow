import { Matches } from "class-validator";

export class AccountsReceivableQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "asOf must use YYYY-MM-DD format" })
  asOf!: string;
}
