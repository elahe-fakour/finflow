import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { isUUID } from "class-validator";
import { Prisma, BankAccountStatus } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import { BankTransactionsRepository } from "../bank-transactions/bank-transactions.repository.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import {
  createCsvPreview,
  createImportSourceFingerprint,
  CsvPreviewError,
  type CsvPreviewRow,
} from "./csv-preview.js";

type UploadedCsvFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };
type StoredPreview = {
  bankAccountId: string;
  createdAt: number;
  fileName: string;
  rows: CsvPreviewRow[];
  userId: string;
  workspaceId: string;
};

const previewLifetimeMs = 10 * 60 * 1000;
const idempotencyKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type BankTransactionImportPreview = {
  duplicateRowCount: number;
  fileName: string;
  invalidRowCount: number;
  previewToken: string;
  rows: CsvPreviewRow[];
  validRowCount: number;
};

export type ConfirmBankTransactionImportResponse = {
  batchId: string;
  idempotencyReplayed: boolean;
  importedRowCount: number;
};

export type BankTransactionImportHistoryItem = {
  bankAccount: {
    id: string;
    name: string;
  };
  fileName: string;
  id: string;
  importedAt: string;
  importedRowCount: number;
};

@Injectable()
export class BankTransactionImportsService {
  private readonly previews = new Map<string, StoredPreview>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsRepository: BankTransactionsRepository,
  ) {}

  async preview(
    scope: WorkspaceScope,
    userId: string,
    bankAccountId: string,
    file: UploadedCsvFile | undefined,
  ): Promise<BankTransactionImportPreview> {
    if (file === undefined) {
      throw new BadRequestException({ code: "CSV_FILE_REQUIRED", message: "Upload one CSV file." });
    }
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      throw new BadRequestException({
        code: "CSV_INVALID_FILE_TYPE",
        message: "Upload a .csv file.",
      });
    }

    const account = await this.transactionsRepository.findBankAccount(scope, bankAccountId);
    if (account === null) throw bankAccountNotFound();
    if (account.status !== BankAccountStatus.ACTIVE) throw bankAccountArchived();

    let parsedRows: CsvPreviewRow[];
    try {
      parsedRows = createCsvPreview(file.buffer.toString("utf8"));
    } catch (error) {
      if (error instanceof CsvPreviewError) {
        throw new BadRequestException({ code: error.code, message: error.message });
      }
      throw error;
    }

    const fingerprints = parsedRows
      .filter(isValidRow)
      .map((row) => createImportSourceFingerprint(bankAccountId, row));
    const alreadyImported = new Set(
      (
        await this.prisma.database.bankTransaction.findMany({
          where: {
            workspaceId: scope.workspaceId,
            bankAccountId,
            importSourceFingerprint: { in: fingerprints },
          },
          select: { importSourceFingerprint: true },
        })
      )
        .map((transaction) => transaction.importSourceFingerprint)
        .filter((fingerprint): fingerprint is string => fingerprint !== null),
    );

    const rows = parsedRows.map((row) => {
      if (!isValidRow(row)) return row;
      return alreadyImported.has(createImportSourceFingerprint(bankAccountId, row))
        ? { ...row, status: "DUPLICATE" as const }
        : row;
    });
    const previewToken = randomUUID();
    this.deleteExpiredPreviews();
    this.previews.set(previewToken, {
      bankAccountId,
      createdAt: Date.now(),
      fileName: file.originalname,
      rows,
      userId,
      workspaceId: scope.workspaceId,
    });

    return {
      duplicateRowCount: rows.filter((row) => row.status === "DUPLICATE").length,
      fileName: file.originalname,
      invalidRowCount: rows.filter((row) => row.status === "ERROR").length,
      previewToken,
      rows,
      validRowCount: rows.filter((row) => row.status === "VALID").length,
    };
  }

  async confirm(
    scope: WorkspaceScope,
    userId: string,
    previewToken: string,
    rawIdempotencyKey: string | undefined,
  ): Promise<ConfirmBankTransactionImportResponse> {
    const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
    const replay = await this.prisma.database.bankTransactionImportBatch.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId: scope.workspaceId, idempotencyKey } },
    });

    if (replay !== null) {
      if (replay.importedByUserId !== userId) {
        throw new ConflictException({
          code: "IDEMPOTENCY_KEY_REUSED",
          message: "This Idempotency-Key has already been used by another user.",
        });
      }
      return {
        batchId: replay.id,
        idempotencyReplayed: true,
        importedRowCount: replay.importedRowCount,
      };
    }

    const preview = this.requirePreview(scope, userId, previewToken);
    const invalidRows = preview.rows.filter((row) => row.status !== "VALID");
    if (invalidRows.length > 0) {
      throw new BadRequestException({
        code: "CSV_PREVIEW_NOT_CONFIRMABLE",
        message: "Correct every invalid or duplicate row before confirming this import.",
      });
    }

    const validRows = preview.rows.filter(isValidRow);
    if (validRows.length === 0) {
      throw new BadRequestException({
        code: "CSV_PREVIEW_NOT_CONFIRMABLE",
        message: "This import preview has no valid rows to confirm.",
      });
    }

    try {
      const batch = await this.prisma.withTransaction(async (transaction) => {
        const account = await this.transactionsRepository.findBankAccount(
          scope,
          preview.bankAccountId,
          transaction,
        );
        if (account === null) throw bankAccountNotFound();
        if (account.status !== BankAccountStatus.ACTIVE) throw bankAccountArchived();

        const createdBatch = await transaction.bankTransactionImportBatch.create({
          data: {
            workspaceId: scope.workspaceId,
            bankAccountId: preview.bankAccountId,
            importedByUserId: userId,
            idempotencyKey,
            fileName: preview.fileName,
            rowCount: preview.rows.length,
            importedRowCount: validRows.length,
          },
        });

        await transaction.bankTransaction.createMany({
          data: validRows.map((row) => ({
            workspaceId: scope.workspaceId,
            bankAccountId: preview.bankAccountId,
            importBatchId: createdBatch.id,
            importSourceFingerprint: createImportSourceFingerprint(preview.bankAccountId, row),
            externalId: row.externalId,
            amountMinorUnits: BigInt(row.amountMinorUnits),
            transactionDate: new Date(`${row.transactionDate}T00:00:00.000Z`),
            description: row.description,
            reference: row.reference,
          })),
        });

        return createdBatch;
      });

      this.previews.delete(previewToken);
      return {
        batchId: batch.id,
        idempotencyReplayed: false,
        importedRowCount: batch.importedRowCount,
      };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException({
          code: "CSV_BANK_TRANSACTION_ALREADY_IMPORTED",
          message:
            "One or more rows were already imported. Preview the file again before confirming.",
        });
      }
      throw error;
    }
  }

  async listHistory(scope: WorkspaceScope): Promise<BankTransactionImportHistoryItem[]> {
    const batches = await this.prisma.database.bankTransactionImportBatch.findMany({
      where: { workspaceId: scope.workspaceId },
      include: {
        bankAccount: {
          select: { id: true, name: true },
        },
      },
      orderBy: { importedAt: "desc" },
      take: 5,
    });

    return batches.map((batch) => ({
      bankAccount: batch.bankAccount,
      fileName: batch.fileName,
      id: batch.id,
      importedAt: batch.importedAt.toISOString(),
      importedRowCount: batch.importedRowCount,
    }));
  }

  private requirePreview(scope: WorkspaceScope, userId: string, token: string): StoredPreview {
    const preview = this.previews.get(token);
    if (
      preview === undefined ||
      preview.workspaceId !== scope.workspaceId ||
      preview.userId !== userId ||
      preview.createdAt + previewLifetimeMs < Date.now()
    ) {
      this.previews.delete(token);
      throw new NotFoundException({
        code: "CSV_PREVIEW_EXPIRED",
        message: "This CSV preview has expired. Preview the file again before confirming.",
      });
    }
    return preview;
  }

  private deleteExpiredPreviews(): void {
    const now = Date.now();
    for (const [token, preview] of this.previews) {
      if (preview.createdAt + previewLifetimeMs < now) this.previews.delete(token);
    }
  }
}

function isValidRow(row: CsvPreviewRow): row is CsvPreviewRow & {
  amountMinorUnits: string;
  description: string;
  transactionDate: string;
} {
  return (
    row.status === "VALID" &&
    row.amountMinorUnits !== null &&
    row.description !== null &&
    row.transactionDate !== null
  );
}

function normalizeIdempotencyKey(value: string | undefined): string {
  const idempotencyKey = value?.trim();
  if (
    idempotencyKey === undefined ||
    !idempotencyKeyPattern.test(idempotencyKey) ||
    !isUUID(idempotencyKey)
  ) {
    throw new BadRequestException({
      code: "IDEMPOTENCY_KEY_REQUIRED",
      message: "Idempotency-Key must be a UUID.",
    });
  }
  return idempotencyKey.toLowerCase();
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function bankAccountNotFound(): NotFoundException {
  return new NotFoundException({
    code: "BANK_ACCOUNT_NOT_FOUND",
    message: "The requested bank account was not found.",
  });
}

function bankAccountArchived(): ConflictException {
  return new ConflictException({
    code: "CSV_BANK_ACCOUNT_ARCHIVED",
    message: "Transactions cannot be imported into an archived bank account.",
  });
}
