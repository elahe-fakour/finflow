import { BadRequestException, ConflictException } from "@nestjs/common";
import {
  BankAccountStatus,
  BankAccountType,
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
