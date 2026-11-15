import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import { AccountsReceivableQueryDto } from "./dto/accounts-receivable-query.dto.js";
import { CashFlowQueryDto } from "./dto/cash-flow-query.dto.js";
import { ProfitLossQueryDto } from "./dto/profit-loss-query.dto.js";
import {
  ReportsService,
  type AccountsReceivableReportResponse,
  type CashFlowReportResponse,
  type ProfitLossReportResponse,
} from "./reports.service.js";

@Controller("workspaces/:workspaceId/reports")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("profit-loss")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getProfitLoss(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: ProfitLossQueryDto,
  ): Promise<ProfitLossReportResponse> {
    return this.reportsService.getProfitLoss(access, input);
  }

  @Get("cash-flow")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getCashFlow(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: CashFlowQueryDto,
  ): Promise<CashFlowReportResponse> {
    return this.reportsService.getCashFlow(access, input);
  }

  @Get("accounts-receivable")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getAccountsReceivable(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: AccountsReceivableQueryDto,
  ): Promise<AccountsReceivableReportResponse> {
    return this.reportsService.getAccountsReceivable(access, input);
  }
}
