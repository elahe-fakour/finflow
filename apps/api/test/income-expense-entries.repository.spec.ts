import { IncomeExpenseType } from "../src/generated/prisma/client.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import { IncomeExpenseEntriesRepository } from "../src/income-expense-entries/income-expense-entries.repository.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b4" };
const entryId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";

describe("IncomeExpenseEntriesRepository", () => {
  it("lists a workspace's entries with deterministic pagination and filters", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const repository = createRepository({ findMany, count });
    const from = new Date("2026-10-01T00:00:00.000Z");
    const to = new Date("2026-10-07T00:00:00.000Z");

    await repository.list(scope, {
      type: IncomeExpenseType.EXPENSE,
      categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b6",
      from,
      to,
      page: 2,
      pageSize: 25,
    });

    const where = {
      workspaceId: scope.workspaceId,
      type: IncomeExpenseType.EXPENSE,
      categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b6",
      occurredOn: { gte: from, lte: to },
    };
    expect(findMany).toHaveBeenCalledWith({
      where,
      include: { category: true, vendor: true },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: 25,
      take: 25,
    });
    expect(count).toHaveBeenCalledWith({ where });
  });

  it("uses the composite workspace and entry key for an exact lookup", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = createRepository({ findUnique });

    await repository.findById(scope, entryId);

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: entryId,
        },
      },
      include: { category: true, vendor: true },
    });
  });
});

function createRepository(entryDelegate: Record<string, ReturnType<typeof vi.fn>>) {
  return new IncomeExpenseEntriesRepository({
    database: {
      incomeExpenseEntry: entryDelegate,
    },
  } as unknown as PrismaService);
}
