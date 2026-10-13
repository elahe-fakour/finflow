import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BankAccountStatus } from "../generated/prisma/client.js";
import { BankTransactionsRepository } from "../bank-transactions/bank-transactions.repository.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import { createCsvPreview, CsvPreviewError, type CsvPreviewRow } from "./csv-preview.js";

type UploadedCsvFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };
export type BankTransactionImportPreview = {
  fileName: string;
  invalidRowCount: number;
  rows: CsvPreviewRow[];
  validRowCount: number;
};

@Injectable()
export class BankTransactionImportsService {
  constructor(private readonly transactionsRepository: BankTransactionsRepository) {}

  async preview(
    scope: WorkspaceScope,
    bankAccountId: string,
    file: UploadedCsvFile | undefined,
  ): Promise<BankTransactionImportPreview> {
    if (file === undefined)
      throw new BadRequestException({ code: "CSV_FILE_REQUIRED", message: "Upload one CSV file." });
    if (!file.originalname.toLowerCase().endsWith(".csv"))
      throw new BadRequestException({
        code: "CSV_INVALID_FILE_TYPE",
        message: "Upload a .csv file.",
      });
    const account = await this.transactionsRepository.findBankAccount(scope, bankAccountId);
    if (account === null)
      throw new NotFoundException({
        code: "BANK_ACCOUNT_NOT_FOUND",
        message: "The requested bank account was not found.",
      });
    if (account.status !== BankAccountStatus.ACTIVE)
      throw new BadRequestException({
        code: "CSV_BANK_ACCOUNT_ARCHIVED",
        message: "Transactions cannot be imported into an archived bank account.",
      });

    let rows: CsvPreviewRow[];
    try {
      rows = createCsvPreview(file.buffer.toString("utf8"));
    } catch (error) {
      if (error instanceof CsvPreviewError)
        throw new BadRequestException({ code: error.code, message: error.message });
      throw error;
    }

    return {
      fileName: file.originalname,
      invalidRowCount: rows.filter((row) => row.status === "ERROR").length,
      rows,
      validRowCount: rows.filter((row) => row.status === "VALID").length,
    };
  }
}
