import {
  BankAccountStatus,
  BankAccountType,
  type BankAccount,
} from "../src/generated/prisma/client.js";
import type { BankTransactionsRepository } from "../src/bank-transactions/bank-transactions.repository.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import { BankTransactionImportsService } from "../src/bank-transaction-imports/bank-transaction-imports.service.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b4" };
const userId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";
const bankAccountId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";
const idempotencyKey = "e3268a34-1814-41d1-904f-2328b67d473a";

describe("BankTransactionImportsService", () => {
  it("confirms a valid server-side preview by creating one batch and all rows together", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
      importedRowCount: 2,
    });
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const service = createService({ create, createMany });

    const preview = await service.preview(scope, userId, bankAccountId, {
      buffer: Buffer.from(
        "transactionDate,description,amount,externalId\n2026-10-12,Stripe payout,1250.50,payout-1\n2026-10-13,Subscription,-88.00,subscription-1",
      ),
      mimetype: "text/csv",
      originalname: "statement.csv",
      size: 1,
    });
    const result = await service.confirm(scope, userId, preview.previewToken, idempotencyKey);

    expect(result).toEqual({
      batchId: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
      idempotencyReplayed: false,
      importedRowCount: 2,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bankAccountId,
          fileName: "statement.csv",
          idempotencyKey,
          importedByUserId: userId,
          importedRowCount: 2,
          rowCount: 2,
          workspaceId: scope.workspaceId,
        }),
      }),
    );
    expect(createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ amountMinorUnits: 125050n, externalId: "payout-1" }),
        expect.objectContaining({ amountMinorUnits: -8800n, externalId: "subscription-1" }),
      ]),
    });
  });

  it("returns the most recent import-batch metadata for the current workspace", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        bankAccount: { id: bankAccountId, name: "Operating account" },
        fileName: "october-statement.csv",
        id: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
        importedAt: new Date("2026-10-13T12:00:00.000Z"),
        importedRowCount: 2,
      },
    ]);
    const service = createService({ findMany });

    await expect(service.listHistory(scope)).resolves.toEqual([
      {
        bankAccount: { id: bankAccountId, name: "Operating account" },
        fileName: "october-statement.csv",
        id: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
        importedAt: "2026-10-13T12:00:00.000Z",
        importedRowCount: 2,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { importedAt: "desc" },
        take: 5,
        where: { workspaceId: scope.workspaceId },
      }),
    );
  });
});

function createService({
  create = vi.fn(),
  createMany = vi.fn(),
  findMany = vi.fn().mockResolvedValue([]),
}: {
  create?: ReturnType<typeof vi.fn>;
  createMany?: ReturnType<typeof vi.fn>;
  findMany?: ReturnType<typeof vi.fn>;
}): BankTransactionImportsService {
  const transaction = {
    bankTransactionImportBatch: { create },
    bankTransaction: { createMany },
  };
  const prisma = {
    database: {
      bankTransaction: { findMany: vi.fn().mockResolvedValue([]) },
      bankTransactionImportBatch: { findMany, findUnique: vi.fn().mockResolvedValue(null) },
    },
    withTransaction: vi.fn((work) => work(transaction)),
  } as unknown as PrismaService;
  const repository = {
    findBankAccount: vi.fn().mockResolvedValue(createBankAccount()),
  } as unknown as BankTransactionsRepository;

  return new BankTransactionImportsService(prisma, repository);
}

function createBankAccount(): BankAccount {
  return {
    accountLastFour: null,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    currency: "USD",
    id: bankAccountId,
    institutionName: null,
    name: "Operating account",
    openingBalanceDate: null,
    openingBalanceMinorUnits: 0n,
    status: BankAccountStatus.ACTIVE,
    type: BankAccountType.CHECKING,
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    workspaceId: scope.workspaceId,
  };
}
