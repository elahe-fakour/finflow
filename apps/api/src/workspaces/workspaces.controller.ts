import { CurrentUser } from "@nestjs/authentication";
import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { RenameWorkspaceDto } from "./dto/rename-workspace.dto.js";
import { RequireWorkspacePermission } from "./require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "./workspace-access.js";
import { WorkspaceMembershipGuard } from "./workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "./workspace-permission.guard.js";
import { WorkspacePermission } from "./workspace-permissions.js";
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

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AccessibleWorkspace[]> {
    return this.workspacesService.listForUser(user);
  }

  @Get(":workspaceId")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getById(@CurrentWorkspace() access: WorkspaceAccess): Promise<AccessibleWorkspace> {
    return this.workspacesService.getForMember(access);
  }

  @Patch(":workspaceId")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_SETTINGS)
  rename(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: RenameWorkspaceDto,
  ): Promise<AccessibleWorkspace> {
    return this.workspacesService.renameForManager(access, input);
  }
}
