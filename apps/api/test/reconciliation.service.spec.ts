import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ReconciliationService } from "../src/reconciliation/reconciliation.service.js";

const scope = { workspaceId: "workspace-1" };
const transaction = {
  id: "transaction-1",
  amountMinorUnits: 125_000n,
  transactionDate: new Date("2026-09-10T00:00:00.000Z"),
  description: "Stripe Payment INV-2026-0182 Acme Ltd.",
  reference: null,
  bankAccount: { currency: "USD" },
  reconciliations: [],
};

const invoice = {
  id: "invoice-1",
  invoiceNumber: "INV-2026-0182",
  status: "SENT" as const,
  currency: "USD",
  dueDate: new Date("2026-09-10T00:00:00.000Z"),
  totalMinorUnits: 125_000n,
  customer: { name: "Acme Ltd." },
  payments: [],
};

describe("reconciliation service", () => {
  it("returns ranked, explainable suggestions without writing", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(transaction),
      listInvoiceCandidates: vi.fn().mockResolvedValue([invoice]),
    };
    const service = new ReconciliationService(repository);

    await expect(service.listSuggestions(scope, transaction.id)).resolves.toMatchObject({
      bankTransaction: {
        amountMinorUnits: "125000",
        id: transaction.id,
        transactionDate: "2026-09-10",
      },
      suggestions: [
        expect.objectContaining({
          classification: "HIGH",
          invoiceId: invoice.id,
          scoreBasisPoints: 9_600,
        }),
      ],
    });

    expect(repository.findTransaction).toHaveBeenCalledWith(scope, transaction.id);
    expect(repository.listInvoiceCandidates).toHaveBeenCalledWith(scope, "USD");
  });

  it("subtracts existing payments before scoring outstanding amount", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(transaction),
      listInvoiceCandidates: vi.fn().mockResolvedValue([
        { ...invoice, payments: [{ amountMinorUnits: 25_000n }] },
      ]),
    };
    const service = new ReconciliationService(repository);

    await expect(service.listSuggestions(scope, transaction.id)).resolves.toMatchObject({
      suggestions: [],
    });
  });

  it("does not expose another workspace transaction", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(null),
      listInvoiceCandidates: vi.fn(),
    };
    const service = new ReconciliationService(repository);

    await expect(service.listSuggestions(scope, "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.listInvoiceCandidates).not.toHaveBeenCalled();
  });
});
