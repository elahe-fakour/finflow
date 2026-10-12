import { Body, Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import {
  BankTransactionsService,
  type CreateBankTransactionResponse,
} from "./bank-transactions.service.js";
import { CreateBankTransactionDto } from "./dto/create-bank-transaction.dto.js";

@Controller("workspaces/:workspaceId/bank-transactions")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class BankTransactionsController {
  constructor(private readonly bankTransactionsService: BankTransactionsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  create(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: CreateBankTransactionDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
  ): Promise<CreateBankTransactionResponse> {
    return this.bankTransactionsService.create(access, input, idempotencyKey);
  }
}
