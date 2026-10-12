import { BadRequestException, ConflictException } from "@nestjs/common";
import {
  BankAccountStatus,
  BankAccountType,
  IncomeExpenseType,
  type BankAccount,
  type BankTransaction,
} from "../src/generated/prisma/client.js";
import type { BankTransactionsRepository } from "../src/bank-transactions/bank-transactions.repository.js";
import { BankTransactionsService } from "../src/bank-transactions/bank-transactions.service.js";
import type { CreateBankTransactionDto } from "../src/bank-transactions/dto/create-bank-transaction.dto.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b4" };
const bankAccountId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";
const idempotencyKey = "e3268a34-1814-41d1-904f-2328b67d473a";

describe("BankTransactionsService", () => {
  it("creates and serializes a signed transaction without JSON number conversion", async () => {
    const create = vi.fn().mockResolvedValue(createBankTransaction());
    const service = createService({
      create,
      findBankAccount: vi.fn().mockResolvedValue(createBankAccount()),
      findByIdempotencyKey: vi.fn().mockResolvedValue(null),
    });

    await expect(service.create(scope, createInput(), idempotencyKey)).resolves.toMatchObject({
      amountMinorUnits: "-125050",
      idempotencyReplayed: false,
      transactionDate: "2026-10-11",
    });
    expect(create).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        amountMinorUnits: -125050n,
        idempotencyKey,
        transactionDate: new Date("2026-10-11T00:00:00.000Z"),
      }),
    );
  });

  it("replays an identical request without creating a second transaction", async () => {
    const create = vi.fn();
    const service = createService({
      create,
      findByIdempotencyKey: vi.fn().mockResolvedValue(createBankTransaction()),
    });

    await expect(service.create(scope, createInput(), idempotencyKey)).resolves.toMatchObject({
      idempotencyReplayed: true,
      id: "6efc89d9-c720-45f6-82cd-ee29e80314b6",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects reuse of an idempotency key with different transaction details", async () => {
    const service = createService({
      findByIdempotencyKey: vi.fn().mockResolvedValue(createBankTransaction()),
    });
    const input = { ...createInput(), description: "Different payment" };

    const error = await service
      .create(scope, input, idempotencyKey)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      code: "IDEMPOTENCY_KEY_REUSED",
    });
  });

  it("does not create a transaction for an archived bank account", async () => {
    const create = vi.fn();
    const service = createService({
      create,
      findBankAccount: vi
        .fn()
        .mockResolvedValue(createBankAccount({ status: BankAccountStatus.ARCHIVED })),
      findByIdempotencyKey: vi.fn().mockResolvedValue(null),
    });

    const error = await service
      .create(scope, createInput(), idempotencyKey)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      code: "BANK_ACCOUNT_ARCHIVED",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("requires a UUID idempotency key", async () => {
    const service = createService({});

    const error = await service
      .create(scope, createInput(), undefined)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
  });

  it("lists signed transactions with account display data and pagination", async () => {
    const list = vi.fn().mockResolvedValue({
      transactions: [createBankTransactionRecord()],
      totalItems: 26,
    });
    const service = createService({ list });

    await expect(
      service.list(scope, {
        direction: "OUTFLOW",
        page: 2,
        pageSize: 25,
        q: "contractor",
      }),
    ).resolves.toMatchObject({
      data: [
        {
          amountMinorUnits: "-125050",
          bankAccount: { id: bankAccountId, name: "Operating account", currency: "USD" },
        },
      ],
      page: 2,
      totalItems: 26,
      totalPages: 2,
    });
    expect(list).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({ direction: "OUTFLOW", page: 2, pageSize: 25, q: "contractor" }),
    );
  });

  it("rejects an inverted transaction date range before querying the database", async () => {
    const list = vi.fn();
    const service = createService({ list });

    const error = await service
      .list(scope, { from: "2026-10-11", page: 1, pageSize: 25, to: "2026-10-01" })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "INVALID_DATE_RANGE",
    });
    expect(list).not.toHaveBeenCalled();
  });

  it("assigns a matching expense category to an outflow", async () => {
    const updateCategory = vi
      .fn()
      .mockResolvedValue(createBankTransactionRecord({ category: createCategory() }));
    const service = createService({
      findById: vi.fn().mockResolvedValue(createBankTransactionRecord()),
      findCategory: vi.fn().mockResolvedValue(createCategory()),
      updateCategory,
    });

    await expect(
      service.assignCategory(scope, "6efc89d9-c720-45f6-82cd-ee29e80314b6", {
        categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
      }),
    ).resolves.toMatchObject({ category: { name: "Contractors", type: "EXPENSE" } });
    expect(updateCategory).toHaveBeenCalledWith(
      scope,
      "6efc89d9-c720-45f6-82cd-ee29e80314b6",
      "6efc89d9-c720-45f6-82cd-ee29e80314b7",
    );
  });

  it("rejects an income category for an outflow before updating the transaction", async () => {
    const updateCategory = vi.fn();
    const service = createService({
      findById: vi.fn().mockResolvedValue(createBankTransactionRecord()),
      findCategory: vi.fn().mockResolvedValue(createCategory({ type: IncomeExpenseType.INCOME })),
      updateCategory,
    });

    const error = await service
      .assignCategory(scope, "6efc89d9-c720-45f6-82cd-ee29e80314b6", {
        categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "CATEGORY_TYPE_MISMATCH",
    });
    expect(updateCategory).not.toHaveBeenCalled();
  });
});

function createService(repository: Record<string, ReturnType<typeof vi.fn>>) {
  return new BankTransactionsService(repository as unknown as BankTransactionsRepository);
}

function createInput(): CreateBankTransactionDto {
  return {
    bankAccountId,
    amountMinorUnits: "-125050",
    description: "Contractor payment",
    reference: "ACH-4242",
    transactionDate: "2026-10-11",
  };
}

function createBankAccount(overrides: Partial<BankAccount> = {}): BankAccount {
  const now = new Date("2026-10-11T12:00:00.000Z");

  return {
    id: bankAccountId,
    workspaceId: scope.workspaceId,
    name: "Operating account",
    type: BankAccountType.CHECKING,
    status: BankAccountStatus.ACTIVE,
    currency: "USD",
    institutionName: null,
    accountLastFour: null,
    openingBalanceMinorUnits: 0n,
    openingBalanceDate: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createBankTransaction(): BankTransaction {
  const now = new Date("2026-10-11T12:00:00.000Z");

  return {
    id: "6efc89d9-c720-45f6-82cd-ee29e80314b6",
    workspaceId: scope.workspaceId,
    bankAccountId,
    idempotencyKey,
    externalId: null,
    amountMinorUnits: -125050n,
    transactionDate: new Date("2026-10-11T00:00:00.000Z"),
    description: "Contractor payment",
    reference: "ACH-4242",
    createdAt: now,
    updatedAt: now,
  };
}

function createBankTransactionRecord(
  overrides: { category?: ReturnType<typeof createCategory> | null } = {},
) {
  return {
    ...createBankTransaction(),
    bankAccount: {
      currency: "USD",
      id: bankAccountId,
      name: "Operating account",
    },
    category: null,
    ...overrides,
  };
}

function createCategory(
  overrides: Partial<{ id: string; name: string; type: IncomeExpenseType }> = {},
) {
  return {
    id: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
    name: "Contractors",
    type: IncomeExpenseType.EXPENSE,
    ...overrides,
  };
}
