import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { AuthCredentialsDto } from "./auth-credentials.dto.js";

export class RegisterDto extends AuthCredentialsDto {
  @Transform(({ value }: { value: unknown }) => normalizeDisplayName(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;
}

function normalizeDisplayName(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}
