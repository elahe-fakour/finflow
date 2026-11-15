import { Matches } from "class-validator";

export class ProfitLossQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "from must use YYYY-MM-DD format" })
  from!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/u, { message: "to must use YYYY-MM-DD format" })
  to!: string;
}
