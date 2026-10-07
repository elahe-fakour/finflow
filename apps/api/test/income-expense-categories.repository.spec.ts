import { IncomeExpenseType } from "../src/generated/prisma/client.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import { IncomeExpenseCategoriesRepository } from "../src/income-expense-categories/income-expense-categories.repository.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b5" };
const categoryId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";

describe("IncomeExpenseCategoriesRepository", () => {
  it("lists categories only from the authorized workspace with an optional type filter", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = createRepository({ findMany });

    await repository.list(scope, IncomeExpenseType.EXPENSE);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        workspaceId: scope.workspaceId,
        type: IncomeExpenseType.EXPENSE,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  });

  it("looks up a category using the composite workspace and category key", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = createRepository({ findUnique });

    await repository.findById(scope, categoryId);

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: categoryId,
        },
      },
    });
  });

  it("creates a category inside the authorized workspace", async () => {
    const create = vi.fn().mockResolvedValue({});
    const repository = createRepository({ create });

    await repository.create(scope, { type: IncomeExpenseType.INCOME, name: "Consulting revenue" });

    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: scope.workspaceId,
        type: IncomeExpenseType.INCOME,
        name: "Consulting revenue",
      },
    });
  });

  it("renames and deletes only through the composite workspace and category key", async () => {
    const update = vi.fn().mockResolvedValue({});
    const deleteCategory = vi.fn().mockResolvedValue({});
    const repository = createRepository({ update, delete: deleteCategory });

    await repository.rename(scope, categoryId, "Software subscriptions");
    await repository.delete(scope, categoryId);

    const where = {
      workspaceId_id: {
        workspaceId: scope.workspaceId,
        id: categoryId,
      },
    };
    expect(update).toHaveBeenCalledWith({ where, data: { name: "Software subscriptions" } });
    expect(deleteCategory).toHaveBeenCalledWith({ where });
  });
});

function createRepository(categoryDelegate: Record<string, ReturnType<typeof vi.fn>>) {
  return new IncomeExpenseCategoriesRepository({
    database: {
      incomeExpenseCategory: categoryDelegate,
    },
  } as unknown as PrismaService);
}
