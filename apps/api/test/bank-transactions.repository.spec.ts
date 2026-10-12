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
});

function createRepository(
  bankAccountDelegate: Record<string, ReturnType<typeof vi.fn>>,
  bankTransactionDelegate: Record<string, ReturnType<typeof vi.fn>>,
) {
  return new BankTransactionsRepository({
    database: {
      bankAccount: bankAccountDelegate,
      bankTransaction: bankTransactionDelegate,
    },
  } as unknown as PrismaService);
}
