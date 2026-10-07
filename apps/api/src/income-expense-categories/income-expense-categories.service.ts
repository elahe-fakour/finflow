import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type IncomeExpenseCategory } from "../generated/prisma/client.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { CreateIncomeExpenseCategoryDto } from "./dto/create-income-expense-category.dto.js";
import type { ListIncomeExpenseCategoriesDto } from "./dto/list-income-expense-categories.dto.js";
import type { RenameIncomeExpenseCategoryDto } from "./dto/rename-income-expense-category.dto.js";
import { IncomeExpenseCategoriesRepository } from "./income-expense-categories.repository.js";

@Injectable()
export class IncomeExpenseCategoriesService {
  constructor(private readonly categoriesRepository: IncomeExpenseCategoriesRepository) {}

  list(
    scope: WorkspaceScope,
    input: ListIncomeExpenseCategoriesDto,
  ): Promise<IncomeExpenseCategory[]> {
    return this.categoriesRepository.list(scope, input.type);
  }

  async getById(scope: WorkspaceScope, categoryId: string): Promise<IncomeExpenseCategory> {
    const category = await this.categoriesRepository.findById(scope, categoryId);

    if (category === null) {
      throw categoryNotFound();
    }

    return category;
  }

  async create(
    scope: WorkspaceScope,
    input: CreateIncomeExpenseCategoryDto,
  ): Promise<IncomeExpenseCategory> {
    try {
      return await this.categoriesRepository.create(scope, input);
    } catch (error) {
      if (isUniqueCategoryNameViolation(error)) {
        throw new ConflictException({
          code: "CATEGORY_NAME_ALREADY_EXISTS",
          message: "A category with this name already exists for this type in this workspace.",
        });
      }

      throw error;
    }
  }

  async rename(
    scope: WorkspaceScope,
    categoryId: string,
    input: RenameIncomeExpenseCategoryDto,
  ): Promise<IncomeExpenseCategory> {
    try {
      return await this.categoriesRepository.rename(scope, categoryId, input.name);
    } catch (error) {
      if (isCategoryMissing(error)) {
        throw categoryNotFound();
      }

      if (isUniqueCategoryNameViolation(error)) {
        throw new ConflictException({
          code: "CATEGORY_NAME_ALREADY_EXISTS",
          message: "A category with this name already exists for this type in this workspace.",
        });
      }

      throw error;
    }
  }

  async delete(scope: WorkspaceScope, categoryId: string): Promise<void> {
    try {
      await this.categoriesRepository.delete(scope, categoryId);
    } catch (error) {
      if (isCategoryMissing(error)) {
        throw categoryNotFound();
      }

      if (isCategoryInUse(error)) {
        throw new ConflictException({
          code: "CATEGORY_IN_USE",
          message:
            "This category cannot be deleted because it is used by income or expense entries.",
        });
      }

      throw error;
    }
  }
}

function categoryNotFound(): NotFoundException {
  return new NotFoundException({
    code: "INCOME_EXPENSE_CATEGORY_NOT_FOUND",
    message: "Income or expense category not found.",
  });
}

function isUniqueCategoryNameViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isCategoryMissing(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

function isCategoryInUse(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}
