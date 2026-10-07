import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { IncomeExpenseCategory } from "../generated/prisma/client.js";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import { CreateIncomeExpenseCategoryDto } from "./dto/create-income-expense-category.dto.js";
import { ListIncomeExpenseCategoriesDto } from "./dto/list-income-expense-categories.dto.js";
import { RenameIncomeExpenseCategoryDto } from "./dto/rename-income-expense-category.dto.js";
import { IncomeExpenseCategoriesService } from "./income-expense-categories.service.js";

@Controller("workspaces/:workspaceId/income-expense-categories")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class IncomeExpenseCategoriesController {
  constructor(private readonly categoriesService: IncomeExpenseCategoriesService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  list(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Query() input: ListIncomeExpenseCategoriesDto,
  ): Promise<IncomeExpenseCategory[]> {
    return this.categoriesService.list(access, input);
  }

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  create(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: CreateIncomeExpenseCategoryDto,
  ): Promise<IncomeExpenseCategory> {
    return this.categoriesService.create(access, input);
  }

  @Get(":categoryId")
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  getById(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
  ): Promise<IncomeExpenseCategory> {
    return this.categoriesService.getById(access, categoryId);
  }

  @Patch(":categoryId")
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  rename(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: RenameIncomeExpenseCategoryDto,
  ): Promise<IncomeExpenseCategory> {
    return this.categoriesService.rename(access, categoryId, input);
  }

  @Delete(":categoryId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  async delete(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
  ): Promise<void> {
    await this.categoriesService.delete(access, categoryId);
  }
}
