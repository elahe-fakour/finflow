import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import {
  BankTransactionsService,
  type BankTransactionListItem,
  type CreateBankTransactionResponse,
  type PaginatedBankTransactions,
} from "./bank-transactions.service.js";
import { AssignBankTransactionCategoryDto } from "./dto/assign-bank-transaction-category.dto.js";
import { CreateBankTransactionDto } from "./dto/create-bank-transaction.dto.js";
import { ListBankTransactionsDto } from "./dto/list-bank-transactions.dto.js";

@Controller("workspaces/:workspaceId/bank-transactions")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class BankTransactionsController {
  constructor(private readonly bankTransactionsService: BankTransactionsService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  list(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: ListBankTransactionsDto,
  ): Promise<PaginatedBankTransactions> {
    return this.bankTransactionsService.list(access, input);
  }

  @Get(":bankTransactionId")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getById(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("bankTransactionId", new ParseUUIDPipe()) bankTransactionId: string,
  ): Promise<BankTransactionListItem> {
    return this.bankTransactionsService.getById(access, bankTransactionId);
  }

  @Patch(":bankTransactionId/category")
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  assignCategory(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("bankTransactionId", new ParseUUIDPipe()) bankTransactionId: string,
    @Body() input: AssignBankTransactionCategoryDto,
  ): Promise<BankTransactionListItem> {
    return this.bankTransactionsService.assignCategory(access, bankTransactionId, input);
  }

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
