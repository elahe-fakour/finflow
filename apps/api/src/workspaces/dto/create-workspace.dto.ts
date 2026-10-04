import { Transform } from "class-transformer";
import { IsString, Matches, MaxLength } from "class-validator";

export class CreateWorkspaceDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  @Matches(/\S/u, { message: "name must contain at least one non-whitespace character" })
  name!: string;
}
