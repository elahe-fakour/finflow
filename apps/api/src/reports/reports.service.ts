import { BadRequestException, Injectable } from "@nestjs/common";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { CashFlowQueryDto } from "./dto/cash-flow-query.dto.js";
import type { AccountsReceivableQueryDto } from "./dto/accounts-receivable-query.dto.js";
import type { CategoryBreakdownQueryDto } from "./dto/category-breakdown-query.dto.js";
import type { ProfitLossQueryDto } from "./dto/profit-loss-query.dto.js";
import {
  ReportsRepository,
  type CategoryBreakdownGroup,
  type CashFlowTransaction,
  type ReceivableInvoice,
} from "./reports.repository.js";

export type ProfitLossReportResponse = {
  basis: "ACCRUAL";
  currency: "USD";
  expenses: {
    manualExpenseMinorUnits: string;
    totalMinorUnits: string;
  };
  from: string;
  income: {
    invoiceRevenueMinorUnits: string;
    manualIncomeMinorUnits: string;
    totalMinorUnits: string;
  };
  netProfitMinorUnits: string;
  to: string;
};

export type CashFlowReportResponse = {
  basis: "CASH";
  currency: "USD";
  from: string;
  inflowsMinorUnits: string;
  months: {
    inflowsMinorUnits: string;
    month: string;
    netMinorUnits: string;
    outflowsMinorUnits: string;
  }[];
  netCashFlowMinorUnits: string;
  outflowsMinorUnits: string;
  to: string;
};

export type AccountsReceivableReportResponse = {
  asOf: string;
  currency: "USD";
  invoices: {
    customerName: string;
    dueDate: string;
    invoiceId: string;
    invoiceNumber: string;
    issueDate: string;
    outstandingMinorUnits: string;
    paidMinorUnits: string;
    status: "CURRENT" | "OVERDUE";
    totalMinorUnits: string;
  }[];
  summary: {
    currentMinorUnits: string;
    currentInvoiceCount: number;
    overdueInvoiceCount: number;
    overdueMinorUnits: string;
    totalOutstandingMinorUnits: string;
  };
};

export type CategoryBreakdownReportResponse = {
  basis: "ACCRUAL";
  currency: "USD";
  expenses: {
    categories: {
      amountMinorUnits: string;
      categoryId: string | null;
      categoryName: string;
    }[];
    totalMinorUnits: string;
  };
  from: string;
  manualIncome: {
    categories: {
      amountMinorUnits: string;
      categoryId: string | null;
      categoryName: string;
    }[];
    totalMinorUnits: string;
  };
  to: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async getProfitLoss(
    scope: WorkspaceScope,
    input: ProfitLossQueryDto,
  ): Promise<ProfitLossReportResponse> {
    const from = parseCalendarDate(input.from, "from");
    const to = parseCalendarDate(input.to, "to");

    if (from > to) {
      throw new BadRequestException({
        code: "INVALID_REPORT_DATE_RANGE",
        message: "from must be on or before to.",
      });
    }

    const totals = await this.reportsRepository.getProfitLossTotals(scope, from, to);
    const totalIncome = totals.invoiceRevenueMinorUnits + totals.manualIncomeMinorUnits;
    const netProfit = totalIncome - totals.manualExpenseMinorUnits;

    return {
      basis: "ACCRUAL",
      currency: "USD",
      from: input.from,
      to: input.to,
      income: {
        invoiceRevenueMinorUnits: totals.invoiceRevenueMinorUnits.toString(),
        manualIncomeMinorUnits: totals.manualIncomeMinorUnits.toString(),
        totalMinorUnits: totalIncome.toString(),
      },
      expenses: {
        manualExpenseMinorUnits: totals.manualExpenseMinorUnits.toString(),
        totalMinorUnits: totals.manualExpenseMinorUnits.toString(),
      },
      netProfitMinorUnits: netProfit.toString(),
    };
  }

  async getCashFlow(
    scope: WorkspaceScope,
    input: CashFlowQueryDto,
  ): Promise<CashFlowReportResponse> {
    const from = parseCalendarDate(input.from, "from");
    const to = parseCalendarDate(input.to, "to");

    if (from > to) {
      throw new BadRequestException({
        code: "INVALID_REPORT_DATE_RANGE",
        message: "from must be on or before to.",
      });
    }

    const transactions = await this.reportsRepository.getCashFlowTransactions(scope, from, to);
    const totals = aggregateCashFlow(transactions);

    return {
      basis: "CASH",
      currency: "USD",
      from: input.from,
      to: input.to,
      inflowsMinorUnits: totals.inflowsMinorUnits.toString(),
      outflowsMinorUnits: totals.outflowsMinorUnits.toString(),
      netCashFlowMinorUnits: (totals.inflowsMinorUnits - totals.outflowsMinorUnits).toString(),
      months: [...totals.months.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, values]) => ({
          month,
          inflowsMinorUnits: values.inflowsMinorUnits.toString(),
          outflowsMinorUnits: values.outflowsMinorUnits.toString(),
          netMinorUnits: (values.inflowsMinorUnits - values.outflowsMinorUnits).toString(),
        })),
    };
  }

  async getAccountsReceivable(
    scope: WorkspaceScope,
    input: AccountsReceivableQueryDto,
  ): Promise<AccountsReceivableReportResponse> {
    const asOf = parseCalendarDate(input.asOf, "asOf");
    const invoices = await this.reportsRepository.getReceivableInvoices(scope, asOf);
    return buildAccountsReceivableReport(input.asOf, invoices);
  }

  async getCategoryBreakdown(
    scope: WorkspaceScope,
    input: CategoryBreakdownQueryDto,
  ): Promise<CategoryBreakdownReportResponse> {
    const from = parseCalendarDate(input.from, "from");
    const to = parseCalendarDate(input.to, "to");

    if (from > to) {
      throw new BadRequestException({
        code: "INVALID_REPORT_DATE_RANGE",
        message: "from must be on or before to.",
      });
    }

    const groups = await this.reportsRepository.getCategoryBreakdown(scope, from, to);
    const expenses = groups.filter((group) => group.type === "EXPENSE");
    const manualIncome = groups.filter((group) => group.type === "INCOME");

    return {
      basis: "ACCRUAL",
      currency: "USD",
      from: input.from,
      to: input.to,
      expenses: mapCategoryTotals(expenses),
      manualIncome: mapCategoryTotals(manualIncome),
    };
  }
}

function mapCategoryTotals(groups: CategoryBreakdownGroup[]) {
  const categories = groups
    .map((group) => ({
      amountMinorUnits: group.amountMinorUnits.toString(),
      categoryId: group.categoryId,
      categoryName: group.categoryName,
    }))
    .sort((left, right) => left.categoryName.localeCompare(right.categoryName));
  const totalMinorUnits = groups.reduce((total, group) => total + group.amountMinorUnits, 0n);

  return { categories, totalMinorUnits: totalMinorUnits.toString() };
}

function buildAccountsReceivableReport(
  asOf: string,
  invoices: ReceivableInvoice[],
): AccountsReceivableReportResponse {
  let currentMinorUnits = 0n;
  let overdueMinorUnits = 0n;
  let currentInvoiceCount = 0;
  let overdueInvoiceCount = 0;

  const openInvoices = invoices.flatMap((invoice) => {
    const paidMinorUnits = invoice.payments.reduce(
      (total, payment) => total + payment.amountMinorUnits,
      0n,
    );
    const outstandingMinorUnits = invoice.totalMinorUnits - paidMinorUnits;

    if (outstandingMinorUnits < 0n) {
      throw new BadRequestException({
        code: "INVOICE_PAYMENT_EXCEEDS_TOTAL",
        message: `Payments exceed invoice total for invoice ${invoice.invoiceNumber}.`,
      });
    }
    if (outstandingMinorUnits === 0n) return [];

    const dueDate = toCalendarDate(invoice.dueDate);
    const status: "OVERDUE" | "CURRENT" = dueDate < asOf ? "OVERDUE" : "CURRENT";
    if (status === "OVERDUE") {
      overdueMinorUnits += outstandingMinorUnits;
      overdueInvoiceCount += 1;
    } else {
      currentMinorUnits += outstandingMinorUnits;
      currentInvoiceCount += 1;
    }

    return [
      {
        customerName: invoice.customer.name,
        dueDate,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: toCalendarDate(invoice.issueDate),
        outstandingMinorUnits: outstandingMinorUnits.toString(),
        paidMinorUnits: paidMinorUnits.toString(),
        status,
        totalMinorUnits: invoice.totalMinorUnits.toString(),
      },
    ];
  });

  return {
    asOf,
    currency: "USD",
    invoices: openInvoices,
    summary: {
      currentMinorUnits: currentMinorUnits.toString(),
      currentInvoiceCount,
      overdueInvoiceCount,
      overdueMinorUnits: overdueMinorUnits.toString(),
      totalOutstandingMinorUnits: (currentMinorUnits + overdueMinorUnits).toString(),
    },
  };
}

function aggregateCashFlow(transactions: CashFlowTransaction[]) {
  const totals = {
    inflowsMinorUnits: 0n,
    outflowsMinorUnits: 0n,
    months: new Map<string, { inflowsMinorUnits: bigint; outflowsMinorUnits: bigint }>(),
  };

  for (const transaction of transactions) {
    const month = transaction.transactionDate.toISOString().slice(0, 7);
    const monthlyTotals = totals.months.get(month) ?? {
      inflowsMinorUnits: 0n,
      outflowsMinorUnits: 0n,
    };

    if (transaction.amountMinorUnits > 0n) {
      totals.inflowsMinorUnits += transaction.amountMinorUnits;
      monthlyTotals.inflowsMinorUnits += transaction.amountMinorUnits;
    } else if (transaction.amountMinorUnits < 0n) {
      const outflowMinorUnits = -transaction.amountMinorUnits;
      totals.outflowsMinorUnits += outflowMinorUnits;
      monthlyTotals.outflowsMinorUnits += outflowMinorUnits;
    }

    totals.months.set(month, monthlyTotals);
  }

  return totals;
}

function parseCalendarDate(value: string, field: "asOf" | "from" | "to"): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException({
      code: "INVALID_REPORT_DATE",
      message: `${field} must be a valid calendar date in YYYY-MM-DD format.`,
    });
  }

  return date;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
