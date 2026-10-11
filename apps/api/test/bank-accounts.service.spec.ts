import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  BankAccountStatus,
  BankAccountType,
  type BankAccount,
} from "../src/generated/prisma/client.js";
import type { BankAccountsRepository } from "../src/bank-accounts/bank-accounts.repository.js";
import { BankAccountsService } from "../src/bank-accounts/bank-accounts.service.js";
import type { CreateBankAccountDto } from "../src/bank-accounts/dto/create-bank-account.dto.js";
import type { UpdateBankAccountDto } from "../src/bank-accounts/dto/update-bank-account.dto.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b4" };
const bankAccountId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";

describe("BankAccountsService", () => {
  it("creates and serializes a signed opening balance without JSON number conversion", async () => {
    const create = vi.fn().mockResolvedValue(createBankAccount());
    const service = createService({ create });

    await expect(
      service.create(scope, {
        name: "Operating account",
        type: BankAccountType.CHECKING,
        currency: "USD",
        openingBalanceMinorUnits: "-500",
        openingBalanceDate: "2026-10-01",
      } as CreateBankAccountDto),
    ).resolves.toMatchObject({
      openingBalanceMinorUnits: "-500",
      openingBalanceDate: "2026-10-01",
    });

    expect(create).toHaveBeenCalledWith(
      scope,
      expect.objectContaining({
        openingBalanceMinorUnits: -500n,
        openingBalanceDate: new Date("2026-10-01T00:00:00.000Z"),
      }),
    );
  });

  it("requires an opening balance date for a non-zero opening balance", async () => {
    const service = createService({ create: vi.fn() });

    const error = await service
      .create(scope, {
        name: "Operating account",
        type: BankAccountType.CHECKING,
        currency: "USD",
        openingBalanceMinorUnits: "1",
      } as CreateBankAccountDto)
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "OPENING_BALANCE_DATE_REQUIRED",
    });
  });

  it("rejects an empty update without sending a database write", async () => {
    const update = vi.fn();
    const service = createService({ update });

    const error = await service
      .update(scope, bankAccountId, {} as UpdateBankAccountDto)
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: "BANK_ACCOUNT_UPDATE_REQUIRED",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not reveal an account outside the current workspace", async () => {
    const service = createService({ findById: vi.fn().mockResolvedValue(null) });

    const error = await service
      .getById(scope, bankAccountId)
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: "BANK_ACCOUNT_NOT_FOUND",
    });
  });
});

function createService(repository: Record<string, ReturnType<typeof vi.fn>>) {
  return new BankAccountsService(repository as unknown as BankAccountsRepository);
}

function createBankAccount(): BankAccount {
  const now = new Date("2026-10-01T12:00:00.000Z");

  return {
    id: bankAccountId,
    workspaceId: scope.workspaceId,
    name: "Operating account",
    type: BankAccountType.CHECKING,
    status: BankAccountStatus.ACTIVE,
    currency: "USD",
    institutionName: null,
    accountLastFour: null,
    openingBalanceMinorUnits: -500n,
    openingBalanceDate: new Date("2026-10-01T00:00:00.000Z"),
    createdAt: now,
    updatedAt: now,
  };
}
