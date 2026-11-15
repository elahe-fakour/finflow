import { BadRequestException, Injectable } from "@nestjs/common";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { ProfitLossQueryDto } from "./dto/profit-loss-query.dto.js";
import { ReportsRepository } from "./reports.repository.js";

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
