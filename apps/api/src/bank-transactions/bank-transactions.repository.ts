import { Injectable } from "@nestjs/common";
import type {
  BankAccount,
  BankTransaction,
  IncomeExpenseCategory,
  Prisma,
  PrismaClient,
} from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { BankTransactionDirection } from "./dto/list-bank-transactions.dto.js";

type BankTransactionQueryClient = Pick<
  PrismaClient,
  "bankAccount" | "bankTransaction" | "incomeExpenseCategory"
>;

export type CreateBankTransactionInput = {
  amountMinorUnits: bigint;
  bankAccountId: string;
  description: string;
  externalId: null;
  idempotencyKey: string;
  reference: string | null;
  transactionDate: Date;
};

export type BankTransactionListInput = {
  bankAccountId?: string;
  direction?: BankTransactionDirection;
  from?: Date;
  page: number;
  pageSize: number;
  q?: string;
  to?: Date;
};

export type BankTransactionRecord = BankTransaction & {
  bankAccount: Pick<BankAccount, "currency" | "id" | "name">;
  category: Pick<IncomeExpenseCategory, "id" | "name" | "type"> | null;
};

const transactionRelations = {
  bankAccount: {
    select: {
      currency: true,
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
} as const;

@Injectable()
export class BankTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBankAccount(
    scope: WorkspaceScope,
    bankAccountId: string,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<BankAccount | null> {
    return database.bankAccount.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: bankAccountId,
        },
      },
    });
  }

  async list(
    scope: WorkspaceScope,
    input: BankTransactionListInput,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<{ transactions: BankTransactionRecord[]; totalItems: number }> {
    const where = createTransactionWhere(scope, input);
    const [transactions, totalItems] = await Promise.all([
      database.bankTransaction.findMany({
        where,
        include: transactionRelations,
        orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      database.bankTransaction.count({ where }),
    ]);

    return { transactions, totalItems };
  }

  findById(
    scope: WorkspaceScope,
    transactionId: string,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<BankTransactionRecord | null> {
    return database.bankTransaction.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: transactionId,
        },
      },
      include: transactionRelations,
    });
  }

  findCategory(
    scope: WorkspaceScope,
    categoryId: string,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<IncomeExpenseCategory | null> {
    return database.incomeExpenseCategory.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: categoryId,
        },
      },
    });
  }

  updateCategory(
    scope: WorkspaceScope,
    transactionId: string,
    categoryId: string | null,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<BankTransactionRecord> {
    return database.bankTransaction.update({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: transactionId,
        },
      },
      data: { categoryId },
      include: transactionRelations,
    });
  }

  findByIdempotencyKey(
    scope: WorkspaceScope,
    idempotencyKey: string,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<BankTransaction | null> {
    return database.bankTransaction.findUnique({
      where: {
        workspaceId_idempotencyKey: {
          workspaceId: scope.workspaceId,
          idempotencyKey,
        },
      },
    });
  }

  create(
    scope: WorkspaceScope,
    input: CreateBankTransactionInput,
    database: BankTransactionQueryClient = this.prisma.database,
  ): Promise<BankTransaction> {
    return database.bankTransaction.create({
      data: {
        workspaceId: scope.workspaceId,
        ...input,
      },
    });
  }
}

function createTransactionWhere(
  scope: WorkspaceScope,
  input: BankTransactionListInput,
): Prisma.BankTransactionWhereInput {
  return {
    workspaceId: scope.workspaceId,
    ...(input.bankAccountId === undefined ? {} : { bankAccountId: input.bankAccountId }),
    ...(input.direction === undefined
      ? {}
      : {
          amountMinorUnits: input.direction === "INFLOW" ? { gt: 0n } : { lt: 0n },
        }),
    ...(input.from === undefined && input.to === undefined
      ? {}
      : {
          transactionDate: {
            ...(input.from === undefined ? {} : { gte: input.from }),
            ...(input.to === undefined ? {} : { lte: input.to }),
          },
        }),
    ...(input.q === undefined
      ? {}
      : {
          OR: [
            { description: { contains: input.q, mode: "insensitive" } },
            { reference: { contains: input.q, mode: "insensitive" } },
          ],
        }),
  };
}
