import { Injectable } from "@nestjs/common";
import type {
  IncomeExpenseCategory,
  IncomeExpenseType,
  PrismaClient,
} from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type IncomeExpenseCategoryQueryClient = Pick<PrismaClient, "incomeExpenseCategory">;

export type CreateIncomeExpenseCategoryInput = {
  type: IncomeExpenseType;
  name: string;
};

@Injectable()
export class IncomeExpenseCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    scope: WorkspaceScope,
    type?: IncomeExpenseType,
    database: IncomeExpenseCategoryQueryClient = this.prisma.database,
  ): Promise<IncomeExpenseCategory[]> {
    return database.incomeExpenseCategory.findMany({
      where: {
        workspaceId: scope.workspaceId,
        ...(type === undefined ? {} : { type }),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  }

  findById(
    scope: WorkspaceScope,
    categoryId: string,
    database: IncomeExpenseCategoryQueryClient = this.prisma.database,
  ): Promise<IncomeExpenseCategory | null> {
    return database.incomeExpenseCategory.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: categoryId,
        },
      },
    });
  }

  create(
    scope: WorkspaceScope,
    input: CreateIncomeExpenseCategoryInput,
    database: IncomeExpenseCategoryQueryClient = this.prisma.database,
  ): Promise<IncomeExpenseCategory> {
    return database.incomeExpenseCategory.create({
      data: {
        workspaceId: scope.workspaceId,
        type: input.type,
        name: input.name,
      },
    });
  }

  rename(
    scope: WorkspaceScope,
    categoryId: string,
    name: string,
    database: IncomeExpenseCategoryQueryClient = this.prisma.database,
  ): Promise<IncomeExpenseCategory> {
    return database.incomeExpenseCategory.update({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: categoryId,
        },
      },
      data: { name },
    });
  }

  delete(
    scope: WorkspaceScope,
    categoryId: string,
    database: IncomeExpenseCategoryQueryClient = this.prisma.database,
  ): Promise<IncomeExpenseCategory> {
    return database.incomeExpenseCategory.delete({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: categoryId,
        },
      },
    });
  }
}
