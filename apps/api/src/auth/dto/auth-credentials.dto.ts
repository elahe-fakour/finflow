import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export abstract class AuthCredentialsDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(15)
  @MaxLength(128)
  password!: string;
}

function normalizeEmail(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}
