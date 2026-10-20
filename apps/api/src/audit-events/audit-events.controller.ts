import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import { ListAuditEventsDto } from "./dto/list-audit-events.dto.js";
import { AuditEventsService, type PaginatedAuditEvents } from "./audit-events.service.js";

@Controller("workspaces/:workspaceId/audit-events")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class AuditEventsController {
  constructor(private readonly auditEventsService: AuditEventsService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  list(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: ListAuditEventsDto,
  ): Promise<PaginatedAuditEvents> {
    return this.auditEventsService.list(access, input);
  }
}
