import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import {
  ReconciliationService,
  type ReconciliationSuggestionsResponse,
} from "./reconciliation.service.js";

@Controller("workspaces/:workspaceId/bank-transactions/:bankTransactionId/reconciliation-suggestions")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  listSuggestions(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("bankTransactionId", new ParseUUIDPipe()) bankTransactionId: string,
  ): Promise<ReconciliationSuggestionsResponse> {
    return this.reconciliationService.listSuggestions(access, bankTransactionId);
  }
}
