import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsString, MaxLength } from "class-validator";
import { WorkspaceRole } from "../../generated/prisma/client.js";

export class InviteWorkspaceMemberDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole = WorkspaceRole.MEMBER;
}
