import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type BankAccount, type BankAccountStatus } from "../generated/prisma/client.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { CreateBankAccountDto } from "./dto/create-bank-account.dto.js";
import type { ListBankAccountsDto } from "./dto/list-bank-accounts.dto.js";
import type { UpdateBankAccountDto } from "./dto/update-bank-account.dto.js";
import { BankAccountsRepository, type CreateBankAccountInput } from "./bank-accounts.repository.js";

const MAX_POSTGRES_BIGINT = 9_223_372_036_854_775_807n;

export type BankAccountResponse = {
  accountLastFour: string | null;
  createdAt: string;
  currency: "USD";
  id: string;
  institutionName: string | null;
  name: string;
  openingBalanceDate: string | null;
  openingBalanceMinorUnits: string;
  status: BankAccountStatus;
  type: BankAccount["type"];
  updatedAt: string;
};

@Injectable()
export class BankAccountsService {
  constructor(private readonly bankAccountsRepository: BankAccountsRepository) {}

  async list(scope: WorkspaceScope, input: ListBankAccountsDto): Promise<BankAccountResponse[]> {
    const accounts = await this.bankAccountsRepository.list(scope, input.status);

    return accounts.map(serializeBankAccount);
  }

  async getById(scope: WorkspaceScope, bankAccountId: string): Promise<BankAccountResponse> {
    const account = await this.bankAccountsRepository.findById(scope, bankAccountId);

    if (account === null) {
      throw bankAccountNotFound();
    }

    return serializeBankAccount(account);
  }

  async create(scope: WorkspaceScope, input: CreateBankAccountDto): Promise<BankAccountResponse> {
    const persistenceInput = toCreateInput(input);

    try {
      return serializeBankAccount(
        await this.bankAccountsRepository.create(scope, persistenceInput),
      );
    } catch (error) {
      if (isDuplicateAccountName(error)) {
        throw new ConflictException({
          code: "BANK_ACCOUNT_NAME_ALREADY_EXISTS",
          message: "A bank account with this name already exists in this workspace.",
        });
      }

      throw error;
    }
  }

  async update(
    scope: WorkspaceScope,
    bankAccountId: string,
    input: UpdateBankAccountDto,
  ): Promise<BankAccountResponse> {
    if (!hasUpdate(input)) {
      throw new BadRequestException({
        code: "BANK_ACCOUNT_UPDATE_REQUIRED",
        message: "Provide at least one bank account field to update.",
      });
    }

    try {
      return serializeBankAccount(
        await this.bankAccountsRepository.update(scope, bankAccountId, input),
      );
    } catch (error) {
      if (isBankAccountMissing(error)) {
        throw bankAccountNotFound();
      }

      if (isDuplicateAccountName(error)) {
        throw new ConflictException({
          code: "BANK_ACCOUNT_NAME_ALREADY_EXISTS",
          message: "A bank account with this name already exists in this workspace.",
        });
      }

      throw error;
    }
  }
}

function toCreateInput(input: CreateBankAccountDto): CreateBankAccountInput {
  const openingBalanceMinorUnits = parseOpeningBalanceMinorUnits(
    input.openingBalanceMinorUnits ?? "0",
  );
  const openingBalanceDate =
    input.openingBalanceDate === undefined ? null : parseCalendarDate(input.openingBalanceDate);

  if (openingBalanceMinorUnits !== 0n && openingBalanceDate === null) {
    throw new BadRequestException({
      code: "OPENING_BALANCE_DATE_REQUIRED",
      message: "openingBalanceDate is required when openingBalanceMinorUnits is not zero.",
    });
  }

  return {
    accountLastFour: input.accountLastFour ?? null,
    currency: input.currency,
    institutionName: input.institutionName ?? null,
    name: input.name,
    openingBalanceDate,
    openingBalanceMinorUnits,
    type: input.type,
  };
}

function serializeBankAccount(account: BankAccount): BankAccountResponse {
  if (account.currency !== "USD") {
    throw new Error("Bank account currency is unsupported by the current API contract.");
  }

  return {
    id: account.id,
    name: account.name,
    type: account.type,
    status: account.status,
    currency: account.currency,
    institutionName: account.institutionName,
    accountLastFour: account.accountLastFour,
    openingBalanceMinorUnits: account.openingBalanceMinorUnits.toString(),
    openingBalanceDate:
      account.openingBalanceDate === null ? null : toCalendarDate(account.openingBalanceDate),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

function parseOpeningBalanceMinorUnits(value: string): bigint {
  if (!/^-?(?:0|[1-9]\d*)$/u.test(value)) {
    throw new BadRequestException({
      code: "INVALID_OPENING_BALANCE_MINOR_UNITS",
      message: "openingBalanceMinorUnits must be an integer string.",
    });
  }

  const amount = BigInt(value);

  if (amount < -MAX_POSTGRES_BIGINT || amount > MAX_POSTGRES_BIGINT) {
    throw new BadRequestException({
      code: "INVALID_OPENING_BALANCE_MINOR_UNITS",
      message: "openingBalanceMinorUnits exceeds the supported range.",
    });
  }

  return amount;
}

function parseCalendarDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(date.getTime()) ||
    toCalendarDate(date) !== value
  ) {
    throw new BadRequestException({
      code: "INVALID_OPENING_BALANCE_DATE",
      message: "openingBalanceDate must be a valid calendar date.",
    });
  }

  return date;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function hasUpdate(input: UpdateBankAccountDto): boolean {
  return (
    input.name !== undefined ||
    input.institutionName !== undefined ||
    input.accountLastFour !== undefined ||
    input.status !== undefined
  );
}

function bankAccountNotFound(): NotFoundException {
  return new NotFoundException({
    code: "BANK_ACCOUNT_NOT_FOUND",
    message: "Bank account not found.",
  });
}

function isDuplicateAccountName(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isBankAccountMissing(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
