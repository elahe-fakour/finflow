import { BadRequestException, Injectable } from "@nestjs/common";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { CashFlowQueryDto } from "./dto/cash-flow-query.dto.js";
import type { ProfitLossQueryDto } from "./dto/profit-loss-query.dto.js";
import { ReportsRepository, type CashFlowTransaction } from "./reports.repository.js";

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

function parseCalendarDate(value: string, field: "from" | "to"): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException({
      code: "INVALID_REPORT_DATE",
      message: `${field} must be a valid calendar date in YYYY-MM-DD format.`,
    });
  }

  return date;
}
