import {
  Body,
  Controller,
  Get,
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
import { BankAccountsService, type BankAccountResponse } from "./bank-accounts.service.js";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto.js";
import { ListBankAccountsDto } from "./dto/list-bank-accounts.dto.js";
import { UpdateBankAccountDto } from "./dto/update-bank-account.dto.js";

@Controller("workspaces/:workspaceId/bank-accounts")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  list(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: ListBankAccountsDto,
  ): Promise<BankAccountResponse[]> {
    return this.bankAccountsService.list(access, input);
  }

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  create(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: CreateBankAccountDto,
  ): Promise<BankAccountResponse> {
    return this.bankAccountsService.create(access, input);
  }

  @Get(":bankAccountId")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getById(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("bankAccountId", new ParseUUIDPipe()) bankAccountId: string,
  ): Promise<BankAccountResponse> {
    return this.bankAccountsService.getById(access, bankAccountId);
  }

  @Patch(":bankAccountId")
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  update(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("bankAccountId", new ParseUUIDPipe()) bankAccountId: string,
    @Body() input: UpdateBankAccountDto,
  ): Promise<BankAccountResponse> {
    return this.bankAccountsService.update(access, bankAccountId, input);
  }
}
