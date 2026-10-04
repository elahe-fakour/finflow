import { CurrentUser } from "@nestjs/authentication";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { CurrentWorkspace, type WorkspaceAccess } from "./workspace-access.js";
import { WorkspaceMembershipGuard } from "./workspace-membership.guard.js";
import {
  WorkspacesService,
  type AccessibleWorkspace,
  type CreatedWorkspace,
} from "./workspaces.service.js";

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

  @Get(":workspaceId")
  @UseGuards(WorkspaceMembershipGuard)
  getById(@CurrentWorkspace() access: WorkspaceAccess): Promise<AccessibleWorkspace> {
    return this.workspacesService.getForMember(access);
  }
}
