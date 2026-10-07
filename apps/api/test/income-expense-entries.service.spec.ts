import { BadRequestException, NotFoundException } from "@nestjs/common";
import { IncomeExpenseType, type IncomeExpenseCategory } from "../src/generated/prisma/client.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import type { TransactionClient } from "../src/database/financial-transaction.js";
import type { IncomeExpenseEntriesRepository } from "../src/income-expense-entries/income-expense-entries.repository.js";
import {
  IncomeExpenseEntriesService,
  type IncomeExpenseEntryResponse,
} from "../src/income-expense-entries/income-expense-entries.service.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b4" };
const categoryId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";

describe("IncomeExpenseEntriesService", () => {
  it("creates an entry with bigint money and serializes it safely for JSON", async () => {
    const transaction = {} as TransactionClient;
    const category = createCategory(IncomeExpenseType.EXPENSE);
    const create = vi.fn().mockResolvedValue(createEntry());
    const service = createService(
      { findCategory: vi.fn().mockResolvedValue(category), create },
      transaction,
    );

    await expect(
      service.create(scope, {
        type: IncomeExpenseType.EXPENSE,
        amountMinorUnits: "1250",
        currency: "USD",
        occurredOn: "2026-10-07",
        description: "Software subscription",
        categoryId,
      }),
    ).resolves.toMatchObject({
      amountMinorUnits: "1250",
      occurredOn: "2026-10-07",
      category: {
        id: categoryId,
        name: "Software subscriptions",
        type: IncomeExpenseType.EXPENSE,
      },
    } satisfies Partial<IncomeExpenseEntryResponse>);

    expect(create).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        amountMinorUnits: 1250n,
        occurredOn: new Date("2026-10-07T00:00:00.000Z"),
      }),
      transaction,
    );
  });

  it("rejects a category whose type does not match the entry type", async () => {
    const service = createService({
      findCategory: vi.fn().mockResolvedValue(createCategory(IncomeExpenseType.INCOME)),
    });

    const error = await service
      .create(scope, createExpenseInput())
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "CATEGORY_TYPE_MISMATCH",
    });
  });

  it("rejects a vendor attached to income", async () => {
    const service = createService({
      findCategory: vi.fn().mockResolvedValue(createCategory(IncomeExpenseType.INCOME)),
    });

    const error = await service
      .create(scope, {
        ...createExpenseInput(),
        type: IncomeExpenseType.INCOME,
        vendorId: "6efc89d9-c720-45f6-82cd-ee29e80314b6",
      })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "VENDOR_NOT_ALLOWED_FOR_INCOME",
    });
  });

  it("rejects an inverted date filter range before querying entries", async () => {
    const list = vi.fn();
    const service = createService({ list });

    const error = await service
      .list(scope, { page: 1, pageSize: 25, from: "2026-10-08", to: "2026-10-07" })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "INVALID_DATE_RANGE",
    });
    expect(list).not.toHaveBeenCalled();
  });

  it("does not reveal an entry outside the current workspace", async () => {
    const service = createService({ findById: vi.fn().mockResolvedValue(null) });

    const error = await service
      .getById(scope, "6efc89d9-c720-45f6-82cd-ee29e80314b7")
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: "INCOME_EXPENSE_ENTRY_NOT_FOUND",
    });
  });

  it("revalidates relationships and preserves exact values when updating an entry", async () => {
    const transaction = {} as TransactionClient;
    const currentEntry = createEntry();
    const update = vi.fn().mockResolvedValue({
      ...currentEntry,
      description: "Renewed software subscription",
    });
    const service = createService(
      {
        findById: vi.fn().mockResolvedValue(currentEntry),
        findCategory: vi.fn().mockResolvedValue(createCategory(IncomeExpenseType.EXPENSE)),
        update,
      },
      transaction,
    );

    await expect(
      service.update(scope, currentEntry.id, { description: "Renewed software subscription" }),
    ).resolves.toMatchObject({ description: "Renewed software subscription" });

    expect(update).toHaveBeenCalledWith(
      scope,
      currentEntry.id,
      expect.objectContaining({
        amountMinorUnits: 1250n,
        description: "Renewed software subscription",
      }),
      transaction,
    );
  });
});

function createService(
  repository: Record<string, ReturnType<typeof vi.fn>>,
  transaction = {} as TransactionClient,
) {
  return new IncomeExpenseEntriesService(
    {
      withTransaction: vi.fn((work) => work(transaction)),
    } as unknown as PrismaService,
    repository as unknown as IncomeExpenseEntriesRepository,
  );
}

function createCategory(type: IncomeExpenseType): IncomeExpenseCategory {
  return {
    id: categoryId,
    workspaceId: scope.workspaceId,
    type,
    name: "Software subscriptions",
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  };
}

function createEntry() {
  const now = new Date("2026-10-07T10:00:00.000Z");

  return {
    id: "6efc89d9-c720-45f6-82cd-ee29e80314b8",
    workspaceId: scope.workspaceId,
    categoryId,
    vendorId: null,
    type: IncomeExpenseType.EXPENSE,
    amountMinorUnits: 1250n,
    currency: "USD",
    occurredOn: new Date("2026-10-07T00:00:00.000Z"),
    description: "Software subscription",
    reference: null,
    createdAt: now,
    updatedAt: now,
    category: createCategory(IncomeExpenseType.EXPENSE),
    vendor: null,
  };
}

function createExpenseInput() {
  return {
    type: IncomeExpenseType.EXPENSE,
    amountMinorUnits: "1250",
    currency: "USD" as const,
    occurredOn: "2026-10-07",
    description: "Software subscription",
    categoryId,
  };
}
