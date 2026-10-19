import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import {
  InvoiceStatus,
  PaymentMethod,
  ReconciliationMatchType,
  ReconciliationStatus,
} from "../generated/prisma/client.js";
import { runFinancialTransaction } from "../database/financial-transaction.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import {
  rankInvoiceCandidates,
  type CandidateInvoice,
  type CandidateTransaction,
  type ScoredInvoiceCandidate,
} from "./candidate-scoring.js";
import {
  ReconciliationRepository,
  type ReconciliationInvoiceRecord,
  type ReconciliationTransactionRecord,
} from "./reconciliation.repository.js";
import type { ConfirmReconciliationDto } from "./dto/confirm-reconciliation.dto.js";

export type ReconciliationSuggestionsResponse = {
  bankTransaction: {
    amountMinorUnits: string;
    description: string;
    id: string;
    reference: string | null;
    transactionDate: string;
  };
  suggestions: ScoredInvoiceCandidate[];
};

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly reconciliationRepository: ReconciliationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async confirm(
    scope: WorkspaceScope,
    bankTransactionId: string,
    input: ConfirmReconciliationDto,
    idempotencyKey: string,
  ) {
    return runFinancialTransaction(this.prisma.database, async (database) => {
      const existing = await database.reconciliation.findUnique({
        where: {
          workspaceId_idempotencyKey: { workspaceId: scope.workspaceId, idempotencyKey },
        },
        select: { bankTransactionId: true, id: true, paymentId: true, status: true },
      });

      if (existing !== null) {
        return { idempotencyReplayed: true, ...existing };
      }

      const transaction = await database.bankTransaction.findUnique({
        where: { workspaceId_id: { workspaceId: scope.workspaceId, id: bankTransactionId } },
        select: {
          amountMinorUnits: true,
          bankAccount: { select: { currency: true } },
          reconciliations: {
            where: { status: ReconciliationStatus.CONFIRMED },
            select: { id: true },
          },
          reference: true,
          transactionDate: true,
        },
      });
      const invoice = await database.invoice.findUnique({
        where: { workspaceId_id: { workspaceId: scope.workspaceId, id: input.invoiceId } },
        select: {
          currency: true,
          dueDate: true,
          payments: { select: { amountMinorUnits: true } },
          status: true,
          totalMinorUnits: true,
        },
      });

      if (transaction === null || invoice === null) throw reconciliationNotFound();
      if (transaction.amountMinorUnits <= 0n) throw ineligibleReconciliation();
      if (transaction.reconciliations.length > 0) throw alreadyReconciled();
      if (invoice.currency !== transaction.bankAccount.currency) throw ineligibleReconciliation();
      if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.OVERDUE) {
        throw ineligibleReconciliation();
      }

      const paid = invoice.payments.reduce(
        (total, payment) => total + payment.amountMinorUnits,
        0n,
      );
      const outstanding = invoice.totalMinorUnits - paid;
      if (outstanding !== transaction.amountMinorUnits || outstanding <= 0n) {
        throw ineligibleReconciliation();
      }

      const payment = await database.payment.create({
        data: {
          workspaceId: scope.workspaceId,
          invoiceId: input.invoiceId,
          amountMinorUnits: transaction.amountMinorUnits,
          receivedAt: transaction.transactionDate,
          method: PaymentMethod.BANK_TRANSFER,
          reference: transaction.reference,
        },
        select: { id: true },
      });
      await database.invoice.update({
        where: { workspaceId_id: { workspaceId: scope.workspaceId, id: input.invoiceId } },
        data: { status: InvoiceStatus.PAID },
      });
      const reconciliation = await database.reconciliation.create({
        data: {
          workspaceId: scope.workspaceId,
          bankTransactionId,
          paymentId: payment.id,
          status: ReconciliationStatus.CONFIRMED,
          matchType: ReconciliationMatchType.SUGGESTED,
          confidenceBasisPoints: input.confidenceBasisPoints,
          idempotencyKey,
        },
        select: { bankTransactionId: true, id: true, paymentId: true, status: true },
      });

      return { idempotencyReplayed: false, ...reconciliation };
    });
  }

  async listSuggestions(
    scope: WorkspaceScope,
    bankTransactionId: string,
  ): Promise<ReconciliationSuggestionsResponse> {
    const transaction = await this.reconciliationRepository.findTransaction(
      scope,
      bankTransactionId,
    );

    if (transaction === null) {
      throw new NotFoundException({
        code: "BANK_TRANSACTION_NOT_FOUND",
        message: "The requested bank transaction was not found.",
      });
    }

    const invoices = await this.reconciliationRepository.listInvoiceCandidates(
      scope,
      transaction.bankAccount.currency,
    );

    return {
      bankTransaction: serializeTransaction(transaction),
      suggestions: rankInvoiceCandidates(
        toCandidateTransaction(transaction, scope.workspaceId),
        invoices.map((invoice) => toCandidateInvoice(invoice, scope.workspaceId)),
      ),
    };
  }
}

function reconciliationNotFound(): NotFoundException {
  return new NotFoundException({
    code: "RECONCILIATION_RESOURCE_NOT_FOUND",
    message: "The transaction or invoice was not found.",
  });
}

function ineligibleReconciliation(): ConflictException {
  return new ConflictException({
    code: "RECONCILIATION_NOT_ELIGIBLE",
    message: "The transaction and invoice no longer satisfy reconciliation rules.",
  });
}

function alreadyReconciled(): ConflictException {
  return new ConflictException({
    code: "TRANSACTION_ALREADY_RECONCILED",
    message: "The bank transaction already has an active reconciliation.",
  });
}

function toCandidateTransaction(
  transaction: ReconciliationTransactionRecord,
  workspaceId: string,
): CandidateTransaction {
  return {
    amountMinorUnits: transaction.amountMinorUnits,
    bankAccountCurrency: transaction.bankAccount.currency,
    description: transaction.description,
    hasActiveReconciliation: transaction.reconciliations.length > 0,
    reference: transaction.reference,
    transactionDate: toCalendarDate(transaction.transactionDate),
    workspaceId,
  };
}

function toCandidateInvoice(
  record: ReconciliationInvoiceRecord,
  workspaceId: string,
): CandidateInvoice {
  const paidMinorUnits = record.payments.reduce(
    (total, payment) => total + payment.amountMinorUnits,
    0n,
  );

  return {
    currency: record.currency,
    customerName: record.customer.name,
    dueDate: toCalendarDate(record.dueDate),
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    outstandingMinorUnits: record.totalMinorUnits - paidMinorUnits,
    status: record.status,
    workspaceId,
  };
}

function serializeTransaction(
  transaction: ReconciliationTransactionRecord,
): ReconciliationSuggestionsResponse["bankTransaction"] {
  return {
    amountMinorUnits: transaction.amountMinorUnits.toString(),
    description: transaction.description,
    id: transaction.id,
    reference: transaction.reference,
    transactionDate: toCalendarDate(transaction.transactionDate),
  };
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
