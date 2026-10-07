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
import { CreateIncomeExpenseEntryDto } from "./dto/create-income-expense-entry.dto.js";
import { ListIncomeExpenseEntriesDto } from "./dto/list-income-expense-entries.dto.js";
import { UpdateIncomeExpenseEntryDto } from "./dto/update-income-expense-entry.dto.js";
import {
  IncomeExpenseEntriesService,
  type IncomeExpenseEntryResponse,
  type PaginatedIncomeExpenseEntries,
} from "./income-expense-entries.service.js";

@Controller("workspaces/:workspaceId/income-expense-entries")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class IncomeExpenseEntriesController {
  constructor(private readonly entriesService: IncomeExpenseEntriesService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  list(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: ListIncomeExpenseEntriesDto,
  ): Promise<PaginatedIncomeExpenseEntries> {
    return this.entriesService.list(access, input);
  }

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  create(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: CreateIncomeExpenseEntryDto,
  ): Promise<IncomeExpenseEntryResponse> {
    return this.entriesService.create(access, input);
  }

  @Get(":entryId")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getById(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("entryId", new ParseUUIDPipe()) entryId: string,
  ): Promise<IncomeExpenseEntryResponse> {
    return this.entriesService.getById(access, entryId);
  }

  @Patch(":entryId")
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  update(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("entryId", new ParseUUIDPipe()) entryId: string,
    @Body() input: UpdateIncomeExpenseEntryDto,
  ): Promise<IncomeExpenseEntryResponse> {
    return this.entriesService.update(access, entryId, input);
  }
}
