import type { PrismaService } from "../src/database/prisma.service.js";
import { BankTransactionsRepository } from "../src/bank-transactions/bank-transactions.repository.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b5" };
const bankAccountId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";
const idempotencyKey = "e3268a34-1814-41d1-904f-2328b67d473a";

describe("BankTransactionsRepository", () => {
  it("looks up an idempotency key inside the authorized workspace", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = createRepository({}, { findUnique });

    await repository.findByIdempotencyKey(scope, idempotencyKey);

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: scope.workspaceId,
          idempotencyKey,
        },
      },
    });
  });

  it("creates a transaction inside the authorized workspace", async () => {
    const create = vi.fn().mockResolvedValue({});
    const repository = createRepository({}, { create });
    const input = {
      bankAccountId,
      amountMinorUnits: -125050n,
      description: "Contractor payment",
      externalId: null,
      idempotencyKey,
      reference: "ACH-4242",
      transactionDate: new Date("2026-10-11T00:00:00.000Z"),
    };

    await repository.create(scope, input);

    expect(create).toHaveBeenCalledWith({
      data: { workspaceId: scope.workspaceId, ...input },
    });
  });

  it("queries only the authorized workspace with search, direction, date, and account filters", async () => {
    const count = vi.fn().mockResolvedValue(0);
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = createRepository({}, { count, findMany });

    await repository.list(scope, {
      bankAccountId,
      direction: "OUTFLOW",
      from: new Date("2026-10-01T00:00:00.000Z"),
      page: 2,
      pageSize: 25,
      q: "Stripe",
      to: new Date("2026-10-11T00:00:00.000Z"),
    });

    const expectedWhere = {
      workspaceId: scope.workspaceId,
      bankAccountId,
      amountMinorUnits: { lt: 0n },
      transactionDate: {
        gte: new Date("2026-10-01T00:00:00.000Z"),
        lte: new Date("2026-10-11T00:00:00.000Z"),
      },
      OR: [
        { description: { contains: "Stripe", mode: "insensitive" } },
        { reference: { contains: "Stripe", mode: "insensitive" } },
      ],
    };

    expect(findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      include: {
        bankAccount: { select: { currency: true, id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: 25,
      take: 25,
    });
    expect(count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it("loads and updates a transaction category only inside the authorized workspace", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const update = vi.fn().mockResolvedValue({});
    const repository = createRepository({ findUnique }, { findUnique, update }, { findUnique });
    const transactionId = "6efc89d9-c720-45f6-82cd-ee29e80314b8";
    const categoryId = "6efc89d9-c720-45f6-82cd-ee29e80314b7";

    await repository.findById(scope, transactionId);
    await repository.findCategory(scope, categoryId);
    await repository.updateCategory(scope, transactionId, categoryId);

    expect(update).toHaveBeenCalledWith({
      where: { workspaceId_id: { workspaceId: scope.workspaceId, id: transactionId } },
      data: { categoryId },
      include: {
        bankAccount: { select: { currency: true, id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });
  });
});

function createRepository(
  bankAccountDelegate: Record<string, ReturnType<typeof vi.fn>>,
  bankTransactionDelegate: Record<string, ReturnType<typeof vi.fn>>,
  incomeExpenseCategoryDelegate: Record<string, ReturnType<typeof vi.fn>> = {},
) {
  return new BankTransactionsRepository({
    database: {
      bankAccount: bankAccountDelegate,
      bankTransaction: bankTransactionDelegate,
      incomeExpenseCategory: incomeExpenseCategoryDelegate,
    },
  } as unknown as PrismaService);
}
