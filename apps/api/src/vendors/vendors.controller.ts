import { Controller, Get, UseGuards } from "@nestjs/common";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import { type VendorOption } from "./vendors.repository.js";
import { VendorsService } from "./vendors.service.js";

@Controller("workspaces/:workspaceId/vendors")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  list(@CurrentWorkspace() access: WorkspaceAccess): Promise<VendorOption[]> {
    return this.vendorsService.list(access);
  }
}
