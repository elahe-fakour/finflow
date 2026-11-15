import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { CashFlowChart, type CashFlowDataPoint } from "@/components/dashboard/cash-flow-chart";
import {
  ExpenseBreakdownChart,
  type ExpenseBreakdownDataPoint,
} from "@/components/dashboard/expense-breakdown-chart";
import {
  ProfitLossSummaryPanel,
  type ProfitLossSummary,
} from "@/components/dashboard/dashboard-summary-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CircleDollarSign, Landmark, ReceiptText, WalletCards } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review sample cash flow, expenses, and profit and loss in FinFlow.",
};

const reportingPeriod = "September 2026";

const reportMetrics = [
  {
    description: `${reportingPeriod} · sample data`,
    icon: CircleDollarSign,
    label: "Income",
    value: "$24,850.00",
  },
  {
    description: `${reportingPeriod} · sample data`,
    icon: ReceiptText,
    label: "Expenses",
    value: "$8,420.00",
  },
  {
    description: "Income minus expenses · sample data",
    icon: WalletCards,
    label: "Net profit",
    value: "$16,430.00",
  },
  {
    description: "Across 3 accounts · sample data",
    icon: Landmark,
    label: "Cash balance",
    value: "$31,620.00",
  },
];

const cashFlowData: CashFlowDataPoint[] = [
  { period: "Apr", netCashFlowCents: 425_000 },
  { period: "May", netCashFlowCents: 510_000 },
  { period: "Jun", netCashFlowCents: 378_000 },
  { period: "Jul", netCashFlowCents: 642_000 },
  { period: "Aug", netCashFlowCents: 584_000 },
  { period: "Sep", netCashFlowCents: 711_000 },
];

const expenseBreakdown: ExpenseBreakdownDataPoint[] = [
  { category: "Payroll", amountCents: 315_000, color: "#117d73" },
  { category: "Contractors", amountCents: 195_000, color: "#15998c" },
  { category: "Software", amountCents: 122_000, color: "#22b8a7" },
  { category: "Marketing", amountCents: 104_000, color: "#55cbb8" },
  { category: "Other", amountCents: 106_000, color: "#94dfd2" },
];

const profitLossSummary: ProfitLossSummary = {
  income: "$24,850.00",
  expenses: "($8,420.00)",
  netProfit: "$16,430.00",
};

export default function ReportsPage() {
  return (
    <section aria-labelledby="reports-title">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            Financial analysis
          </p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="reports-title"
          >
            Reports
          </h1>
          <p className="max-w-2xl text-base leading-7 text-secondary-foreground">
            Review cash movement, spending categories, and a profit and loss summary.
          </p>
        </div>
        <div className="inline-flex min-h-11 items-center gap-2 self-start rounded-control border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm sm:self-auto">
          <CalendarDays aria-hidden="true" className="size-5 text-primary" />
          {reportingPeriod}
          <Badge variant="outline">Sample</Badge>
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-secondary-foreground sm:px-5">
        These figures are illustrative sample data. Reports are not connected to live workspace
        records yet.
      </div>

      <section
        aria-label="Key report metrics"
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {reportMetrics.map((metric) => (
          <DashboardKpiCard key={metric.label} {...metric} />
        ))}
      </section>

      <section
        aria-label="Cash flow and expense reports"
        className="mt-6 grid gap-6 xl:grid-cols-2"
      >
        <CashFlowChart data={cashFlowData} />
        <ExpenseBreakdownChart data={expenseBreakdown} />
      </section>

      <section aria-label="Profit and loss report" className="mt-6 grid gap-6 xl:grid-cols-2">
        <ProfitLossSummaryPanel summary={profitLossSummary} />
        <Card>
          <CardHeader>
            <CardTitle as="h2">About this report</CardTitle>
            <CardDescription>How to read the current sample figures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-secondary-foreground">
            <p>The cash flow chart shows monthly net movement from April through September 2026.</p>
            <p>
              The expense chart groups the September sample expenses by category. Net profit is the
              sample income total less sample expenses.
            </p>
            <p>
              Cash and profit are different measures: the cash balance shown here is an illustrative
              account total, not the net profit calculation.
            </p>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
