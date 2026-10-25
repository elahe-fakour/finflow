import { CurrentUser } from "@nestjs/authentication";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { InviteWorkspaceMemberDto } from "./dto/invite-workspace-member.dto.js";
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
import { InvitationDeliveryWorker } from "./invitation-delivery.worker.js";

@Controller("workspaces")
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly invitationDeliveryWorker: InvitationDeliveryWorker,
  ) {}

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

  @Post("invitations/:token/accept")
  acceptInvitation(@CurrentUser() user: AuthenticatedUser, @Param("token") token: string) {
    return this.workspacesService.acceptInvitation(token, user);
  }

  @Post("internal/invitation-delivery/process")
  processInvitationDelivery() {
    if (process.env.NODE_ENV?.trim().toLowerCase() === "production") {
      throw new ForbiddenException("Development invitation delivery is disabled in production.");
    }

    return this.invitationDeliveryWorker.processPending();
  }

  @Get(":workspaceId")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getById(@CurrentWorkspace() access: WorkspaceAccess): Promise<AccessibleWorkspace> {
    return this.workspacesService.getForMember(access);
  }

  @Get(":workspaceId/members")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_MEMBERS)
  listMembers(@CurrentWorkspace() access: WorkspaceAccess) {
    return this.workspacesService.listMembers(access);
  }

  @Post(":workspaceId/members")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_MEMBERS)
  inviteMember(
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: InviteWorkspaceMemberDto,
  ) {
    return this.workspacesService.inviteMember(access, actor, input);
  }

  @Get(":workspaceId/invitations")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_MEMBERS)
  listPendingInvitations(@CurrentWorkspace() access: WorkspaceAccess) {
    return this.workspacesService.listPendingInvitations(access);
  }

  @Post(":workspaceId/invitations/:invitationId/revoke")
  @UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_MEMBERS)
  revokeInvitation(
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("invitationId") invitationId: string,
  ) {
    return this.workspacesService.revokeInvitation(access, actor, invitationId);
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
