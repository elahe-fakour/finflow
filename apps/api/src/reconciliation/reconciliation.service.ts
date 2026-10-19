import { Injectable, NotFoundException } from "@nestjs/common";
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
  constructor(private readonly reconciliationRepository: ReconciliationRepository) {}

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
