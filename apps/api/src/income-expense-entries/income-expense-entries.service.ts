import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { IncomeExpenseType, type IncomeExpenseCategory } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { CreateIncomeExpenseEntryDto } from "./dto/create-income-expense-entry.dto.js";
import type { ListIncomeExpenseEntriesDto } from "./dto/list-income-expense-entries.dto.js";
import type { UpdateIncomeExpenseEntryDto } from "./dto/update-income-expense-entry.dto.js";
import {
  IncomeExpenseEntriesRepository,
  type CreateIncomeExpenseEntryInput,
  type IncomeExpenseEntryRecord,
} from "./income-expense-entries.repository.js";

const MAX_POSTGRES_BIGINT = 9_223_372_036_854_775_807n;

export type IncomeExpenseEntryResponse = {
  id: string;
  type: IncomeExpenseType;
  amountMinorUnits: string;
  currency: string;
  occurredOn: string;
  description: string;
  reference: string | null;
  category: { id: string; name: string; type: IncomeExpenseType };
  vendor: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedIncomeExpenseEntries = {
  data: IncomeExpenseEntryResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

@Injectable()
export class IncomeExpenseEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entriesRepository: IncomeExpenseEntriesRepository,
  ) {}

  async list(
    scope: WorkspaceScope,
    input: ListIncomeExpenseEntriesDto,
  ): Promise<PaginatedIncomeExpenseEntries> {
    const dateRange = validateDateRange(input.from, input.to);
    const result = await this.entriesRepository.list(scope, {
      type: input.type,
      categoryId: input.categoryId,
      vendorId: input.vendorId,
      ...dateRange,
      page: input.page,
      pageSize: input.pageSize,
    });

    return {
      data: result.entries.map(serializeEntry),
      page: input.page,
      pageSize: input.pageSize,
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / input.pageSize),
    };
  }

  async getById(scope: WorkspaceScope, entryId: string): Promise<IncomeExpenseEntryResponse> {
    const entry = await this.entriesRepository.findById(scope, entryId);

    if (entry === null) {
      throw entryNotFound();
    }

    return serializeEntry(entry);
  }

  async create(
    scope: WorkspaceScope,
    input: CreateIncomeExpenseEntryDto,
  ): Promise<IncomeExpenseEntryResponse> {
    const entry = await this.prisma.withTransaction(async (transaction) => {
      const persistenceInput = await this.toPersistenceInput(scope, input, transaction);

      return this.entriesRepository.create(scope, persistenceInput, transaction);
    });

    return serializeEntry(entry);
  }

  async update(
    scope: WorkspaceScope,
    entryId: string,
    input: UpdateIncomeExpenseEntryDto,
  ): Promise<IncomeExpenseEntryResponse> {
    const entry = await this.prisma.withTransaction(async (transaction) => {
      const currentEntry = await this.entriesRepository.findById(scope, entryId, transaction);

      if (currentEntry === null) {
        throw entryNotFound();
      }

      const persistenceInput = await this.toPersistenceInput(
        scope,
        {
          type: input.type ?? currentEntry.type,
          amountMinorUnits: input.amountMinorUnits ?? currentEntry.amountMinorUnits.toString(),
          currency: input.currency ?? currentEntry.currency,
          occurredOn: input.occurredOn ?? toCalendarDate(currentEntry.occurredOn),
          description: input.description ?? currentEntry.description,
          categoryId: input.categoryId ?? currentEntry.categoryId ?? undefined,
          vendorId: hasOwn(input, "vendorId")
            ? (input.vendorId ?? undefined)
            : (currentEntry.vendorId ?? undefined),
          reference: hasOwn(input, "reference")
            ? (input.reference ?? undefined)
            : (currentEntry.reference ?? undefined),
        },
        transaction,
      );

      return this.entriesRepository.update(scope, entryId, persistenceInput, transaction);
    });

    return serializeEntry(entry);
  }

  private async toPersistenceInput(
    scope: WorkspaceScope,
    input: {
      type: IncomeExpenseType;
      amountMinorUnits: string;
      currency: string;
      occurredOn: string;
      description: string;
      categoryId?: string;
      vendorId?: string;
      reference?: string;
    },
    database: Parameters<IncomeExpenseEntriesRepository["create"]>[2],
  ): Promise<CreateIncomeExpenseEntryInput> {
    const categoryId = input.categoryId;

    if (categoryId === undefined) {
      throw new BadRequestException({
        code: "CATEGORY_REQUIRED",
        message: "An income or expense category is required.",
      });
    }

    const category = await this.entriesRepository.findCategory(scope, categoryId, database);
    assertCategoryMatchesEntryType(category, input.type);

    const vendorId = input.vendorId;

    if (vendorId !== undefined) {
      if (input.type !== IncomeExpenseType.EXPENSE) {
        throw new BadRequestException({
          code: "VENDOR_NOT_ALLOWED_FOR_INCOME",
          message: "A vendor may be attached only to an expense entry.",
        });
      }

      const vendor = await this.entriesRepository.findVendor(scope, vendorId, database);

      if (vendor === null) {
        throw new NotFoundException({
          code: "VENDOR_NOT_FOUND",
          message: "Vendor not found.",
        });
      }
    }

    return {
      categoryId,
      vendorId: vendorId ?? null,
      type: input.type,
      amountMinorUnits: parseAmountMinorUnits(input.amountMinorUnits),
      currency: assertSupportedCurrency(input.currency),
      occurredOn: parseCalendarDate(input.occurredOn),
      description: input.description,
      reference: input.reference ?? null,
    };
  }
}

function serializeEntry(entry: IncomeExpenseEntryRecord): IncomeExpenseEntryResponse {
  if (entry.category === null) {
    throw new Error("Income or expense entry is missing its required category relation.");
  }

  return {
    id: entry.id,
    type: entry.type,
    amountMinorUnits: entry.amountMinorUnits.toString(),
    currency: entry.currency,
    occurredOn: toCalendarDate(entry.occurredOn),
    description: entry.description,
    reference: entry.reference,
    category: {
      id: entry.category.id,
      name: entry.category.name,
      type: entry.category.type,
    },
    vendor:
      entry.vendor === null
        ? null
        : {
            id: entry.vendor.id,
            name: entry.vendor.name,
          },
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function assertCategoryMatchesEntryType(
  category: IncomeExpenseCategory | null,
  type: IncomeExpenseType,
): asserts category is IncomeExpenseCategory {
  if (category === null) {
    throw new NotFoundException({
      code: "INCOME_EXPENSE_CATEGORY_NOT_FOUND",
      message: "Income or expense category not found.",
    });
  }

  if (category.type !== type) {
    throw new BadRequestException({
      code: "CATEGORY_TYPE_MISMATCH",
      message: "The category type must match the income or expense entry type.",
    });
  }
}

function parseAmountMinorUnits(value: string): bigint {
  if (!/^[1-9]\d*$/u.test(value)) {
    throw new BadRequestException({
      code: "INVALID_AMOUNT_MINOR_UNITS",
      message: "amountMinorUnits must be a positive integer string.",
    });
  }

  const amount = BigInt(value);

  if (amount > MAX_POSTGRES_BIGINT) {
    throw new BadRequestException({
      code: "INVALID_AMOUNT_MINOR_UNITS",
      message: "amountMinorUnits exceeds the supported range.",
    });
  }

  return amount;
}

function assertSupportedCurrency(currency: string): "USD" {
  if (currency !== "USD") {
    throw new BadRequestException({
      code: "UNSUPPORTED_CURRENCY",
      message: "Only USD is supported at this time.",
    });
  }

  return currency;
}

function validateDateRange(
  from: string | undefined,
  to: string | undefined,
): { from?: Date; to?: Date } {
  const parsedFrom = from === undefined ? undefined : parseCalendarDate(from);
  const parsedTo = to === undefined ? undefined : parseCalendarDate(to);

  if (parsedFrom !== undefined && parsedTo !== undefined && parsedFrom > parsedTo) {
    throw new BadRequestException({
      code: "INVALID_DATE_RANGE",
      message: "from must be on or before to.",
    });
  }

  return { from: parsedFrom, to: parsedTo };
}

function parseCalendarDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(date.getTime()) ||
    toCalendarDate(date) !== value
  ) {
    throw new BadRequestException({
      code: "INVALID_DATE",
      message: "A valid calendar date is required.",
    });
  }

  return date;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function hasOwn(object: object, property: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function entryNotFound(): NotFoundException {
  return new NotFoundException({
    code: "INCOME_EXPENSE_ENTRY_NOT_FOUND",
    message: "Income or expense entry not found.",
  });
}
