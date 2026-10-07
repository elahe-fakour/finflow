import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, IncomeExpenseType } from "../src/generated/prisma/client.js";
import type { IncomeExpenseCategoriesRepository } from "../src/income-expense-categories/income-expense-categories.repository.js";
import { IncomeExpenseCategoriesService } from "../src/income-expense-categories/income-expense-categories.service.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b5" };
const categoryId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";

describe("IncomeExpenseCategoriesService", () => {
  it("delegates a filtered list to the workspace-scoped repository", async () => {
    const list = vi.fn().mockResolvedValue([]);
    const service = createService({ list });

    await expect(service.list(scope, { type: IncomeExpenseType.EXPENSE })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith(scope, IncomeExpenseType.EXPENSE);
  });

  it("returns a stable not-found error for a category outside the workspace", async () => {
    const findById = vi.fn().mockResolvedValue(null);
    const service = createService({ findById });

    const error = await service
      .getById(scope, categoryId)
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: "INCOME_EXPENSE_CATEGORY_NOT_FOUND",
      message: "Income or expense category not found.",
    });
  });

  it("maps a duplicate category name to a business conflict", async () => {
    const create = vi.fn().mockRejectedValue(prismaError("P2002"));
    const service = createService({ create });

    const error = await service
      .create(scope, { type: IncomeExpenseType.INCOME, name: "Consulting revenue" })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      code: "CATEGORY_NAME_ALREADY_EXISTS",
      message: "A category with this name already exists for this type in this workspace.",
    });
  });

  it("maps a missing rename target to the same stable not-found error", async () => {
    const rename = vi.fn().mockRejectedValue(prismaError("P2025"));
    const service = createService({ rename });

    const error = await service
      .rename(scope, categoryId, { name: "Software subscriptions" })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: "INCOME_EXPENSE_CATEGORY_NOT_FOUND",
    });
  });

  it("protects financial history when a referenced category is deleted", async () => {
    const deleteCategory = vi.fn().mockRejectedValue(prismaError("P2003"));
    const service = createService({ delete: deleteCategory });

    const error = await service
      .delete(scope, categoryId)
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      code: "CATEGORY_IN_USE",
      message: "This category cannot be deleted because it is used by income or expense entries.",
    });
  });
});

function createService(repository: Record<string, ReturnType<typeof vi.fn>>) {
  return new IncomeExpenseCategoriesService(
    repository as unknown as IncomeExpenseCategoriesRepository,
  );
}

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Prisma error", {
    code,
    clientVersion: "test",
  });
}
