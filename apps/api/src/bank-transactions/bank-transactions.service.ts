import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BankAccountStatus, Prisma, type BankTransaction } from "../generated/prisma/client.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import {
  BankTransactionsRepository,
  type CreateBankTransactionInput,
} from "./bank-transactions.repository.js";
import type { CreateBankTransactionDto } from "./dto/create-bank-transaction.dto.js";

const MAX_POSTGRES_BIGINT = 9_223_372_036_854_775_807n;
const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type BankTransactionResponse = {
  amountMinorUnits: string;
  bankAccountId: string;
  createdAt: string;
  description: string;
  id: string;
  reference: string | null;
  transactionDate: string;
  updatedAt: string;
};

export type CreateBankTransactionResponse = BankTransactionResponse & {
  idempotencyReplayed: boolean;
};

@Injectable()
export class BankTransactionsService {
  constructor(private readonly bankTransactionsRepository: BankTransactionsRepository) {}

  async create(
    scope: WorkspaceScope,
    input: CreateBankTransactionDto,
    rawIdempotencyKey: string | undefined,
  ): Promise<CreateBankTransactionResponse> {
    const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
    const persistenceInput = toCreateInput(input, idempotencyKey);
    const existingTransaction = await this.bankTransactionsRepository.findByIdempotencyKey(
      scope,
      idempotencyKey,
    );

    if (existingTransaction !== null) {
      return serializeIdempotentResult(existingTransaction, persistenceInput);
    }

    const bankAccount = await this.bankTransactionsRepository.findBankAccount(
      scope,
      persistenceInput.bankAccountId,
    );

    if (bankAccount === null) {
      throw bankAccountNotFound();
    }

    if (bankAccount.status !== BankAccountStatus.ACTIVE) {
      throw new ConflictException({
        code: "BANK_ACCOUNT_ARCHIVED",
        message: "Transactions cannot be recorded against an archived bank account.",
      });
    }

    try {
      return {
        ...serializeBankTransaction(
          await this.bankTransactionsRepository.create(scope, persistenceInput),
        ),
        idempotencyReplayed: false,
      };
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }

      const concurrentTransaction = await this.bankTransactionsRepository.findByIdempotencyKey(
        scope,
        idempotencyKey,
      );

      if (concurrentTransaction === null) {
        throw error;
      }

      return serializeIdempotentResult(concurrentTransaction, persistenceInput);
    }
  }
}

function toCreateInput(
  input: CreateBankTransactionDto,
  idempotencyKey: string,
): CreateBankTransactionInput {
  return {
    amountMinorUnits: parseAmountMinorUnits(input.amountMinorUnits),
    bankAccountId: input.bankAccountId,
    description: input.description,
    externalId: null,
    idempotencyKey,
    reference: input.reference ?? null,
    transactionDate: parseCalendarDate(input.transactionDate),
  };
}

function serializeIdempotentResult(
  transaction: BankTransaction,
  input: CreateBankTransactionInput,
): CreateBankTransactionResponse {
  if (!matchesCreateInput(transaction, input)) {
    throw new ConflictException({
      code: "IDEMPOTENCY_KEY_REUSED",
      message: "This Idempotency-Key has already been used with different transaction details.",
    });
  }

  return { ...serializeBankTransaction(transaction), idempotencyReplayed: true };
}

function serializeBankTransaction(transaction: BankTransaction): BankTransactionResponse {
  return {
    id: transaction.id,
    bankAccountId: transaction.bankAccountId,
    amountMinorUnits: transaction.amountMinorUnits.toString(),
    transactionDate: toCalendarDate(transaction.transactionDate),
    description: transaction.description,
    reference: transaction.reference,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function matchesCreateInput(
  transaction: BankTransaction,
  input: CreateBankTransactionInput,
): boolean {
  return (
    transaction.bankAccountId === input.bankAccountId &&
    transaction.amountMinorUnits === input.amountMinorUnits &&
    transaction.transactionDate.getTime() === input.transactionDate.getTime() &&
    transaction.description === input.description &&
    transaction.reference === input.reference &&
    transaction.externalId === input.externalId
  );
}

function normalizeIdempotencyKey(value: string | undefined): string {
  const idempotencyKey = value?.trim();

  if (idempotencyKey === undefined || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    throw new BadRequestException({
      code: "IDEMPOTENCY_KEY_REQUIRED",
      message: "Idempotency-Key must be a UUID.",
    });
  }

  return idempotencyKey.toLowerCase();
}

function parseAmountMinorUnits(value: string): bigint {
  if (!/^-?(?:[1-9]\d*)$/u.test(value)) {
    throw new BadRequestException({
      code: "INVALID_TRANSACTION_AMOUNT",
      message: "amountMinorUnits must be a non-zero integer string.",
    });
  }

  const amount = BigInt(value);

  if (amount < -MAX_POSTGRES_BIGINT || amount > MAX_POSTGRES_BIGINT) {
    throw new BadRequestException({
      code: "INVALID_TRANSACTION_AMOUNT",
      message: "amountMinorUnits exceeds the supported range.",
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
      code: "INVALID_TRANSACTION_DATE",
      message: "transactionDate must be a valid calendar date.",
    });
  }

  return date;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function bankAccountNotFound(): NotFoundException {
  return new NotFoundException({
    code: "BANK_ACCOUNT_NOT_FOUND",
    message: "Bank account not found.",
  });
}
