import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../src/database/prisma.service.js";
import { ReconciliationRepository } from "../src/reconciliation/reconciliation.repository.js";
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
  dueDate: new Date("2026-09-17T00:00:00.000Z"),
  totalMinorUnits: 125_000n,
  customer: { name: "Acme Ltd." },
  payments: [],
};

describe("reconciliation service", () => {
  it("confirms an eligible suggestion atomically", async () => {
    const reconciliation = {
      bankTransactionId: transaction.id,
      id: "reconciliation-1",
      paymentId: "payment-1",
      status: "CONFIRMED",
    };
    const database = {
      $transaction: vi.fn(async (work: (client: unknown) => unknown) => work(database)),
      reconciliation: {
        create: vi.fn().mockResolvedValue(reconciliation),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      auditEvent: { create: vi.fn().mockResolvedValue({}) },
      bankTransaction: {
        findUnique: vi.fn().mockResolvedValue({
          amountMinorUnits: transaction.amountMinorUnits,
          bankAccount: transaction.bankAccount,
          reconciliations: [],
          reference: transaction.reference,
          transactionDate: transaction.transactionDate,
        }),
      },
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          payments: [],
          status: invoice.status,
          totalMinorUnits: invoice.totalMinorUnits,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      payment: { create: vi.fn().mockResolvedValue({ id: "payment-1" }) },
    };
    const service = new ReconciliationService(
      {
        findTransaction: vi.fn(),
        listInvoiceCandidates: vi.fn(),
      } as unknown as ReconciliationRepository,
      { database } as unknown as PrismaService,
    );

    await expect(
      service.confirm(
        scope,
        "user-1",
        transaction.id,
        { confidenceBasisPoints: 9_600, invoiceId: invoice.id },
        "11111111-1111-4111-8111-111111111111",
      ),
    ).resolves.toMatchObject({ idempotencyReplayed: false, id: reconciliation.id });

    expect(database.payment.create).toHaveBeenCalledOnce();
    expect(database.invoice.update).toHaveBeenCalledOnce();
    expect(database.reconciliation.create).toHaveBeenCalledOnce();
    expect(database.auditEvent.create).toHaveBeenCalledOnce();
  });

  it("returns ranked, explainable suggestions without writing", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(transaction),
      listInvoiceCandidates: vi.fn().mockResolvedValue([invoice]),
    };
    const service = new ReconciliationService(
      repository as unknown as ReconciliationRepository,
      {} as PrismaService,
    );

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

  it("passes the current workspace into candidate scoring", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(transaction),
      listInvoiceCandidates: vi.fn().mockResolvedValue([invoice]),
    };
    const service = new ReconciliationService(
      repository as unknown as ReconciliationRepository,
      {} as PrismaService,
    );

    await expect(service.listSuggestions(scope, transaction.id)).resolves.toMatchObject({
      suggestions: [expect.objectContaining({ invoiceId: invoice.id })],
    });

    const response = await service.listSuggestions(scope, transaction.id);
    expect(response.suggestions[0]?.scoreBasisPoints).toBe(9_600);
  });

  it("subtracts existing payments before scoring outstanding amount", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(transaction),
      listInvoiceCandidates: vi
        .fn()
        .mockResolvedValue([{ ...invoice, payments: [{ amountMinorUnits: 25_000n }] }]),
    };
    const service = new ReconciliationService(
      repository as unknown as ReconciliationRepository,
      {} as PrismaService,
    );

    await expect(service.listSuggestions(scope, transaction.id)).resolves.toMatchObject({
      suggestions: [],
    });
  });

  it("does not expose another workspace transaction", async () => {
    const repository = {
      findTransaction: vi.fn().mockResolvedValue(null),
      listInvoiceCandidates: vi.fn(),
    };
    const service = new ReconciliationService(
      repository as unknown as ReconciliationRepository,
      {} as PrismaService,
    );

    await expect(service.listSuggestions(scope, "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.listInvoiceCandidates).not.toHaveBeenCalled();
  });
});
