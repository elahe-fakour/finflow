import { CurrentUser } from "@nestjs/authentication";
import { Body, Controller, Post } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { WorkspacesService, type CreatedWorkspace } from "./workspaces.service.js";

@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @CurrentUser() owner: AuthenticatedUser,
    @Body() input: CreateWorkspaceDto,
  ): Promise<CreatedWorkspace> {
    return this.workspacesService.createForOwner(owner, input);
  }
}
