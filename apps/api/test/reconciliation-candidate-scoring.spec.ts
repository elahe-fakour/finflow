import {
  rankInvoiceCandidates,
  scoreInvoiceCandidate,
  type CandidateInvoice,
  type CandidateTransaction,
} from "../src/reconciliation/candidate-scoring.js";
import { describe, expect, it } from "vitest";

const transaction: CandidateTransaction = {
  amountMinorUnits: 125_000n,
  bankAccountCurrency: "USD",
  description: "Stripe payment Acme Ltd.",
  hasActiveReconciliation: false,
  reference: "INV-2026-0182",
  transactionDate: "2026-09-10",
  workspaceId: "workspace-1",
};

const invoice: CandidateInvoice = {
  currency: "USD",
  customerName: "Acme Ltd.",
  dueDate: "2026-09-17",
  id: "invoice-1",
  invoiceNumber: "INV-2026-0182",
  outstandingMinorUnits: 125_000n,
  status: "SENT",
  workspaceId: "workspace-1",
};

describe("reconciliation candidate scoring", () => {
  it("returns explainable 96% evidence for the documented example", () => {
    const candidate = scoreInvoiceCandidate(transaction, invoice);

    expect(candidate).toMatchObject({
      classification: "HIGH",
      invoiceId: "invoice-1",
      scoreBasisPoints: 9_600,
    });
    expect(candidate?.evidence.map((item) => [item.code, item.points])).toEqual([
      ["EXACT_AMOUNT", 6_000],
      ["INVOICE_NUMBER", 2_500],
      ["CUSTOMER_NAME", 800],
      ["DATE_PROXIMITY", 300],
    ]);
  });

  it("does not use substring matches for invoice numbers or names", () => {
    const candidate = scoreInvoiceCandidate(transaction, {
      ...invoice,
      customerName: "Acme Ltdx",
      dueDate: "2027-01-01",
      invoiceNumber: "INV-2026-018",
    });

    expect(candidate?.scoreBasisPoints).toBe(6_000);
  });

  it("returns a not-suggested score for an exact-amount-only eligible candidate", () => {
    const candidate = scoreInvoiceCandidate(transaction, {
      ...invoice,
      customerName: "Different Customer",
      dueDate: "2027-01-01",
      invoiceNumber: "OTHER-001",
    });

    expect(candidate).toMatchObject({ classification: "NOT_SUGGESTED", scoreBasisPoints: 6_000 });
  });

  it("rejects financially ineligible candidates", () => {
    const cases: Array<{
      name: string;
      transaction: CandidateTransaction;
      invoice: CandidateInvoice;
    }> = [
      {
        name: "a negative transaction",
        transaction: { ...transaction, amountMinorUnits: -1n },
        invoice,
      },
      {
        name: "a different workspace",
        transaction,
        invoice: { ...invoice, workspaceId: "workspace-2" },
      },
      { name: "a different currency", transaction, invoice: { ...invoice, currency: "EUR" } },
      { name: "a paid invoice", transaction, invoice: { ...invoice, status: "PAID" } },
      {
        name: "an outstanding amount mismatch",
        transaction,
        invoice: { ...invoice, outstandingMinorUnits: 124_999n },
      },
      {
        name: "an already reconciled transaction",
        transaction: { ...transaction, hasActiveReconciliation: true },
        invoice,
      },
    ];

    for (const testCase of cases) {
      expect(
        scoreInvoiceCandidate(testCase.transaction, testCase.invoice),
        testCase.name,
      ).toBeNull();
    }
  });

  it("ranks candidates deterministically and hides scores below the suggestion threshold", () => {
    const candidates = rankInvoiceCandidates(transaction, [
      { ...invoice, id: "invoice-z", invoiceNumber: "INV-Z" },
      { ...invoice, id: "invoice-a", invoiceNumber: "INV-A" },
      {
        ...invoice,
        customerName: "Different Customer",
        dueDate: "2027-01-01",
        id: "invoice-low",
        invoiceNumber: "OTHER-001",
      },
    ]);

    expect(candidates.map((candidate) => candidate.invoiceId)).toEqual(["invoice-a", "invoice-z"]);
  });
});
