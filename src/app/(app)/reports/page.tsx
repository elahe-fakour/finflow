import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import {
  ExpenseBreakdownChart,
  type ExpenseBreakdownDataPoint,
} from "@/components/dashboard/expense-breakdown-chart";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { getCashFlowReport } from "@/lib/reports/cash-flow-report";
import { getCategoryBreakdownReport } from "@/lib/reports/category-breakdown-report";
import { getProfitLossReport } from "@/lib/reports/profit-loss-report";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { CalendarDays, CircleDollarSign, FileText, ReceiptText, WalletCards } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review workspace profit and loss, cash flow, and category breakdowns in FinFlow.",
};

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const chartColors = ["#117d73", "#15998c", "#22b8a7", "#55cbb8", "#94dfd2"];

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const [workspace, params] = await Promise.all([getActiveWorkspace(), searchParams]);
  const defaults = getCurrentMonthRange();
  const from = getCalendarDate(params.from) ?? defaults.from;
  const to = getCalendarDate(params.to) ?? defaults.to;
  const hasValidRange = from <= to;
  const [report, cashFlowReport, categoryBreakdownReport] =
    workspace && hasValidRange
      ? await Promise.all([
          getProfitLossReport(workspace.id, from, to),
          getCashFlowReport(workspace.id, from, to),
          getCategoryBreakdownReport(workspace.id, from, to),
        ])
      : [null, null, null];

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
            Review your workspace profit and loss for a selected date range.
          </p>
        </div>
      </header>

      <form
        action="/reports"
        className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="flex min-h-11 items-center gap-2 pr-1 text-sm font-semibold text-foreground">
          <CalendarDays aria-hidden="true" className="size-5 text-primary" />
          Report period
        </div>
        <label className="grid gap-1.5 text-sm font-medium text-secondary-foreground">
          From
          <input
            className="h-11 rounded-lg border border-input bg-background px-3 text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={from}
            name="from"
            required
            type="date"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-secondary-foreground">
          To
          <input
            className="h-11 rounded-lg border border-input bg-background px-3 text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={to}
            name="to"
            required
            type="date"
          />
        </label>
        <Button className="min-h-11" type="submit">
          Update report
        </Button>
      </form>

      {!workspace ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-6"
          description="Create or join a workspace to view its financial reports."
          icon={FileText}
          title="No workspace available"
        />
      ) : !hasValidRange ? (
        <ErrorState
          className="mt-6"
          description="Choose a start date that is on or before the end date, then update the report."
          title="Invalid report period"
        />
      ) : report === null ? (
        <ErrorState
          className="mt-6"
          description="We couldn't load this workspace report. Check your connection and try again."
          title="Report unavailable"
        />
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-secondary-foreground sm:px-5">
            Live accrual-basis figures for {formatDateRange(report.from, report.to)}. Cash flow uses
            bank transactions. Category breakdowns cover manual income and expenses; invoice revenue
            has no category in FinFlow yet.
          </div>

          <section
            aria-label="Profit and loss metrics"
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <DashboardKpiCard
              description="From invoices and manual income · USD"
              icon={CircleDollarSign}
              label="Total income"
              value={formatUsdMinorUnits(report.income.totalMinorUnits)}
            />
            <DashboardKpiCard
              description="Invoice revenue · USD"
              icon={FileText}
              label="Invoice revenue"
              value={formatUsdMinorUnits(report.income.invoiceRevenueMinorUnits)}
            />
            <DashboardKpiCard
              description="Manual expenses · USD"
              icon={ReceiptText}
              label="Expenses"
              value={formatUsdMinorUnits(report.expenses.totalMinorUnits)}
            />
            <DashboardKpiCard
              description="Income less expenses · USD"
              icon={WalletCards}
              label="Net profit"
              value={formatUsdMinorUnits(report.netProfitMinorUnits)}
            />
          </section>
        </>
      )}

      {workspace && hasValidRange ? (
        <section
          aria-label="Cash flow and category breakdown charts"
          className="mt-6 grid gap-6 xl:grid-cols-2"
        >
          {cashFlowReport === null ? (
            <ErrorState
              description="We couldn't load cash flow for this period. Please try again shortly."
              title="Cash flow unavailable"
            />
          ) : (
            <CashFlowChart
              data={cashFlowReport.months.map((month) => ({
                chartValue: Number(month.netMinorUnits),
                netCashFlowMinorUnits: month.netMinorUnits,
                period: formatMonth(month.month),
              }))}
              isSample={false}
              periodDescription={formatDateRange(cashFlowReport.from, cashFlowReport.to)}
            />
          )}
          {categoryBreakdownReport === null ? (
            <ErrorState
              description="We couldn't load category breakdowns for this period. Please try again shortly."
              title="Category breakdown unavailable"
            />
          ) : (
            <>
              <ExpenseBreakdownChart
                data={mapCategoryData(categoryBreakdownReport.expenses.categories)}
                description={`Manual expenses by category for ${formatDateRange(categoryBreakdownReport.from, categoryBreakdownReport.to)}.`}
                isSample={false}
              />
              <ExpenseBreakdownChart
                data={mapCategoryData(categoryBreakdownReport.manualIncome.categories)}
                description={`Categorized manual income for ${formatDateRange(categoryBreakdownReport.from, categoryBreakdownReport.to)}. Invoice revenue is not included.`}
                isSample={false}
                title="Manual income by category"
                totalLabel="Total manual income"
              />
            </>
          )}
        </section>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle as="h2">About these reports</CardTitle>
          <CardDescription>Data sources and calculation basis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-secondary-foreground">
          <p>
            The profit and loss figures use accrual accounting: invoice revenue is counted by issue
            date, and manual income and expenses are counted by activity date.
          </p>
          <p>
            Cash flow uses signed USD bank transactions grouped by month. Category breakdowns use
            manual income and expense entries; invoice revenue is shown separately because invoices
            do not have categories.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function getCurrentMonthRange(): { from: string; to: string } {
  const today = new Date().toISOString().slice(0, 10);
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

function getCalendarDate(value: string | string[] | undefined): string | null {
  const dateValue = Array.isArray(value) ? value[0] : value;
  if (dateValue === undefined || !/^\d{4}-\d{2}-\d{2}$/u.test(dateValue)) return null;

  const date = new Date(`${dateValue}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateValue
    ? dateValue
    : null;
}

function formatDateRange(from: string, to: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
  return `${formatter.format(new Date(`${from}T00:00:00.000Z`))} – ${formatter.format(new Date(`${to}T00:00:00.000Z`))}`;
}

function formatMonth(value: string): string {
  const date = new Date(`${value}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function mapCategoryData(
  categories: { amountMinorUnits: string; categoryId: string | null; categoryName: string }[],
): ExpenseBreakdownDataPoint[] {
  return categories.map((category, index) => ({
    amountMinorUnits: category.amountMinorUnits,
    category: category.categoryName,
    chartValue: Number(category.amountMinorUnits),
    color: chartColors[index % chartColors.length] ?? "#117d73",
  }));
}
