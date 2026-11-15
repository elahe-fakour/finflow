import { Injectable } from "@nestjs/common";
import { IncomeExpenseType, InvoiceStatus } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

export type ProfitLossTotals = {
  invoiceRevenueMinorUnits: bigint;
  manualIncomeMinorUnits: bigint;
  manualExpenseMinorUnits: bigint;
};

export type CashFlowTransaction = {
  amountMinorUnits: bigint;
  transactionDate: Date;
};

export type ReceivableInvoice = {
  customer: { name: string };
  dueDate: Date;
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  payments: { amountMinorUnits: bigint }[];
  status: InvoiceStatus;
  totalMinorUnits: bigint;
};

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitLossTotals(
    scope: WorkspaceScope,
    from: Date,
    to: Date,
  ): Promise<ProfitLossTotals> {
    const database = this.prisma.database;
    const [invoiceRevenue, manualIncome, manualExpenses] = await Promise.all([
      database.invoice.aggregate({
        where: {
          workspaceId: scope.workspaceId,
          currency: "USD",
          issueDate: { gte: from, lte: to },
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PAID] },
        },
        _sum: { totalMinorUnits: true },
      }),
      database.incomeExpenseEntry.aggregate({
        where: {
          workspaceId: scope.workspaceId,
          currency: "USD",
          type: IncomeExpenseType.INCOME,
          occurredOn: { gte: from, lte: to },
        },
        _sum: { amountMinorUnits: true },
      }),
      database.incomeExpenseEntry.aggregate({
        where: {
          workspaceId: scope.workspaceId,
          currency: "USD",
          type: IncomeExpenseType.EXPENSE,
          occurredOn: { gte: from, lte: to },
        },
        _sum: { amountMinorUnits: true },
      }),
    ]);

    return {
      invoiceRevenueMinorUnits: invoiceRevenue._sum.totalMinorUnits ?? 0n,
      manualIncomeMinorUnits: manualIncome._sum.amountMinorUnits ?? 0n,
      manualExpenseMinorUnits: manualExpenses._sum.amountMinorUnits ?? 0n,
    };
  }

  getCashFlowTransactions(
    scope: WorkspaceScope,
    from: Date,
    to: Date,
  ): Promise<CashFlowTransaction[]> {
    return this.prisma.database.bankTransaction.findMany({
      where: {
        workspaceId: scope.workspaceId,
        transactionDate: { gte: from, lte: to },
        bankAccount: { is: { currency: "USD" } },
      },
      select: { amountMinorUnits: true, transactionDate: true },
      orderBy: [{ transactionDate: "asc" }, { id: "asc" }],
    });
  }

  getReceivableInvoices(scope: WorkspaceScope, asOf: Date): Promise<ReceivableInvoice[]> {
    const endOfAsOfDay = new Date(asOf.getTime() + 24 * 60 * 60 * 1000 - 1);

    return this.prisma.database.invoice.findMany({
      where: {
        workspaceId: scope.workspaceId,
        currency: "USD",
        issueDate: { lte: asOf },
        status: { in: ["SENT", "OVERDUE", "PAID"] },
      },
      select: {
        customer: { select: { name: true } },
        dueDate: true,
        id: true,
        invoiceNumber: true,
        issueDate: true,
        payments: {
          where: { receivedAt: { lte: endOfAsOfDay } },
          select: { amountMinorUnits: true },
        },
        status: true,
        totalMinorUnits: true,
      },
      orderBy: [{ dueDate: "asc" }, { invoiceNumber: "asc" }],
    });
  }
}
