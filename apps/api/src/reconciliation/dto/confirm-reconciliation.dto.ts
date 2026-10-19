import { Type } from "class-transformer";
import { IsInt, IsUUID, Max, Min } from "class-validator";

export class ConfirmReconciliationDto {
  @IsUUID()
  invoiceId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  confidenceBasisPoints!: number;
}
