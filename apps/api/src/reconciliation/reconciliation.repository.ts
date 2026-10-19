import { Injectable } from "@nestjs/common";
import {
  InvoiceStatus,
  ReconciliationStatus,
  type PrismaClient,
} from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type ReconciliationQueryClient = Pick<PrismaClient, "bankTransaction" | "invoice">;

export type ReconciliationTransactionRecord = {
  id: string;
  amountMinorUnits: bigint;
  transactionDate: Date;
  description: string;
  reference: string | null;
  bankAccount: { currency: string };
  reconciliations: Array<{ id: string }>;
};

export type ReconciliationInvoiceRecord = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  dueDate: Date;
  totalMinorUnits: bigint;
  customer: { name: string };
  payments: Array<{ amountMinorUnits: bigint }>;
};

@Injectable()
export class ReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTransaction(
    scope: WorkspaceScope,
    bankTransactionId: string,
    database: ReconciliationQueryClient = this.prisma.database,
  ): Promise<ReconciliationTransactionRecord | null> {
    return database.bankTransaction.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: bankTransactionId,
        },
      },
      select: {
        id: true,
        amountMinorUnits: true,
        transactionDate: true,
        description: true,
        reference: true,
        bankAccount: { select: { currency: true } },
        reconciliations: {
          where: { status: ReconciliationStatus.CONFIRMED },
          select: { id: true },
        },
      },
    });
  }

  listInvoiceCandidates(
    scope: WorkspaceScope,
    currency: string,
    database: ReconciliationQueryClient = this.prisma.database,
  ): Promise<ReconciliationInvoiceRecord[]> {
    return database.invoice.findMany({
      where: {
        workspaceId: scope.workspaceId,
        currency,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
      },
      orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }, { id: "asc" }],
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        currency: true,
        dueDate: true,
        totalMinorUnits: true,
        customer: { select: { name: true } },
        payments: { select: { amountMinorUnits: true } },
      },
    });
  }
}
