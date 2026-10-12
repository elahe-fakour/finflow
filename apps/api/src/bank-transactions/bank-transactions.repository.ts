import { Injectable } from "@nestjs/common";
import type { BankAccount, BankTransaction, PrismaClient } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type BankTransactionQueryClient = Pick<PrismaClient, "bankAccount" | "bankTransaction">;

export type CreateBankTransactionInput = {
  amountMinorUnits: bigint;
  bankAccountId: string;
  description: string;
  externalId: null;
  idempotencyKey: string;
  reference: string | null;
  transactionDate: Date;
};

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
