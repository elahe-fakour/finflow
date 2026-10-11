import { Injectable } from "@nestjs/common";
import type {
  BankAccount,
  BankAccountStatus,
  BankAccountType,
  PrismaClient,
} from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type BankAccountQueryClient = Pick<PrismaClient, "bankAccount">;

export type CreateBankAccountInput = {
  accountLastFour: string | null;
  currency: string;
  institutionName: string | null;
  name: string;
  openingBalanceDate: Date | null;
  openingBalanceMinorUnits: bigint;
  type: BankAccountType;
};

export type UpdateBankAccountInput = {
  accountLastFour?: string | null;
  institutionName?: string | null;
  name?: string;
  status?: BankAccountStatus;
};

@Injectable()
export class BankAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    scope: WorkspaceScope,
    status: BankAccountStatus | undefined,
    database: BankAccountQueryClient = this.prisma.database,
  ): Promise<BankAccount[]> {
    return database.bankAccount.findMany({
      where: {
        workspaceId: scope.workspaceId,
        ...(status === undefined ? {} : { status }),
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
  }

  findById(
    scope: WorkspaceScope,
    bankAccountId: string,
    database: BankAccountQueryClient = this.prisma.database,
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

  create(
    scope: WorkspaceScope,
    input: CreateBankAccountInput,
    database: BankAccountQueryClient = this.prisma.database,
  ): Promise<BankAccount> {
    return database.bankAccount.create({
      data: {
        workspaceId: scope.workspaceId,
        ...input,
      },
    });
  }

  update(
    scope: WorkspaceScope,
    bankAccountId: string,
    input: UpdateBankAccountInput,
    database: BankAccountQueryClient = this.prisma.database,
  ): Promise<BankAccount> {
    return database.bankAccount.update({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: bankAccountId,
        },
      },
      data: input,
    });
  }
}
