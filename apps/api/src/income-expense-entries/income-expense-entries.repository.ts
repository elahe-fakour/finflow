import { Injectable } from "@nestjs/common";
import type {
  IncomeExpenseCategory,
  IncomeExpenseEntry,
  IncomeExpenseType,
  Prisma,
  PrismaClient,
  Vendor,
} from "../generated/prisma/client.js";
import type { TransactionClient } from "../database/financial-transaction.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type IncomeExpenseEntryQueryClient = Pick<
  PrismaClient,
  "incomeExpenseCategory" | "incomeExpenseEntry" | "vendor"
>;
type IncomeExpenseEntryDatabase = IncomeExpenseEntryQueryClient | TransactionClient;

export type IncomeExpenseEntryRecord = IncomeExpenseEntry & {
  category: IncomeExpenseCategory | null;
  vendor: Vendor | null;
};

export type IncomeExpenseEntryListInput = {
  type?: IncomeExpenseType;
  categoryId?: string;
  vendorId?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

export type CreateIncomeExpenseEntryInput = {
  categoryId: string;
  vendorId: string | null;
  type: IncomeExpenseType;
  amountMinorUnits: bigint;
  currency: string;
  occurredOn: Date;
  description: string;
  reference: string | null;
};

export type UpdateIncomeExpenseEntryInput = CreateIncomeExpenseEntryInput;

const entryRelations = {
  category: true,
  vendor: true,
} as const;

@Injectable()
export class IncomeExpenseEntriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    scope: WorkspaceScope,
    input: IncomeExpenseEntryListInput,
    database: IncomeExpenseEntryDatabase = this.prisma.database,
  ): Promise<{ entries: IncomeExpenseEntryRecord[]; totalItems: number }> {
    const where = createEntryWhere(scope, input);
    const [entries, totalItems] = await Promise.all([
      database.incomeExpenseEntry.findMany({
        where,
        include: entryRelations,
        orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      database.incomeExpenseEntry.count({ where }),
    ]);

    return { entries, totalItems };
  }

  findById(
    scope: WorkspaceScope,
    entryId: string,
    database: IncomeExpenseEntryDatabase = this.prisma.database,
  ): Promise<IncomeExpenseEntryRecord | null> {
    return database.incomeExpenseEntry.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: entryId,
        },
      },
      include: entryRelations,
    });
  }

  findCategory(
    scope: WorkspaceScope,
    categoryId: string,
    database: IncomeExpenseEntryDatabase = this.prisma.database,
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

  findVendor(
    scope: WorkspaceScope,
    vendorId: string,
    database: IncomeExpenseEntryDatabase = this.prisma.database,
  ): Promise<Vendor | null> {
    return database.vendor.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: vendorId,
        },
      },
    });
  }

  create(
    scope: WorkspaceScope,
    input: CreateIncomeExpenseEntryInput,
    database: IncomeExpenseEntryDatabase = this.prisma.database,
  ): Promise<IncomeExpenseEntryRecord> {
    return database.incomeExpenseEntry.create({
      data: {
        workspaceId: scope.workspaceId,
        ...input,
      },
      include: entryRelations,
    });
  }

  update(
    scope: WorkspaceScope,
    entryId: string,
    input: UpdateIncomeExpenseEntryInput,
    database: IncomeExpenseEntryDatabase = this.prisma.database,
  ): Promise<IncomeExpenseEntryRecord> {
    return database.incomeExpenseEntry.update({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: entryId,
        },
      },
      data: input,
      include: entryRelations,
    });
  }
}

function createEntryWhere(
  scope: WorkspaceScope,
  input: IncomeExpenseEntryListInput,
): Prisma.IncomeExpenseEntryWhereInput {
  return {
    workspaceId: scope.workspaceId,
    ...(input.type === undefined ? {} : { type: input.type }),
    ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
    ...(input.vendorId === undefined ? {} : { vendorId: input.vendorId }),
    ...(input.from === undefined && input.to === undefined
      ? {}
      : {
          occurredOn: {
            ...(input.from === undefined ? {} : { gte: input.from }),
            ...(input.to === undefined ? {} : { lte: input.to }),
          },
        }),
  };
}
