import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { getAccountsReceivableReport } from "@/lib/reports/accounts-receivable-report";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { CalendarDays, CircleAlert, CircleDollarSign, FileText, FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Receivables",
  description: "Review open customer invoices and outstanding balances in FinFlow.",
};

type ReceivablesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReceivablesPage({ searchParams }: ReceivablesPageProps) {
  const [workspace, params] = await Promise.all([getActiveWorkspace(), searchParams]);
  const defaultAsOf = new Date().toISOString().slice(0, 10);
  const asOf = params.asOf === undefined ? defaultAsOf : getCalendarDate(params.asOf);
  const report =
    workspace && asOf !== null ? await getAccountsReceivableReport(workspace.id, asOf) : null;

  return (
    <section aria-labelledby="receivables-title">
      <header className="space-y-2">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Sales analysis</p>
        <h1
          className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
          id="receivables-title"
        >
          Accounts Receivable
        </h1>
        <p className="max-w-2xl text-base leading-7 text-secondary-foreground">
          Review open customer invoices and what remains to be collected.
        </p>
      </header>

      <form
        action="/receivables"
        className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="flex min-h-11 items-center gap-2 pr-1 text-sm font-semibold text-foreground">
          <CalendarDays aria-hidden="true" className="size-5 text-primary" />
          Balance as of
        </div>
        <label className="grid gap-1.5 text-sm font-medium text-secondary-foreground">
          Date
          <input
            className="h-11 rounded-lg border border-input bg-background px-3 text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={asOf ?? defaultAsOf}
            name="asOf"
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
          description="Create or join a workspace to view its outstanding customer balances."
          icon={FolderPlus}
          title="No workspace available"
        />
      ) : asOf === null ? (
        <ErrorState
          className="mt-6"
          description="Choose a valid calendar date, then update the report."
          title="Invalid report date"
        />
      ) : report === null ? (
        <ErrorState
          className="mt-6"
          description="We couldn't load receivables for this workspace. Please try again shortly."
          title="Receivables unavailable"
        />
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-secondary-foreground sm:px-5">
            Live USD invoice balances as of {formatCalendarDate(report.asOf)}. Payments are counted
            through the end of that UTC date.
          </div>

          <section
            aria-label="Receivables summary"
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <DashboardKpiCard
              description={`${report.invoices.length} open ${report.invoices.length === 1 ? "invoice" : "invoices"} · USD`}
              icon={CircleDollarSign}
              label="Total outstanding"
              value={formatUsdMinorUnits(report.summary.totalOutstandingMinorUnits)}
            />
            <DashboardKpiCard
              description={`${report.summary.overdueInvoiceCount} ${report.summary.overdueInvoiceCount === 1 ? "invoice" : "invoices"} past due`}
              icon={CircleAlert}
              label="Overdue"
              value={formatUsdMinorUnits(report.summary.overdueMinorUnits)}
            />
            <DashboardKpiCard
              description={`${report.summary.currentInvoiceCount} not yet overdue`}
              icon={FileText}
              label="Current"
              value={formatUsdMinorUnits(report.summary.currentMinorUnits)}
            />
          </section>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle as="h2">Open invoices</CardTitle>
              <CardDescription>
                Remaining balance after payments received on or before{" "}
                {formatCalendarDate(report.asOf)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.invoices.length === 0 ? (
                <EmptyState
                  action={
                    <Button asChild variant="outline">
                      <Link href="/invoices">View invoices</Link>
                    </Button>
                  }
                  description="There are no unpaid sent invoices for this date."
                  icon={CircleDollarSign}
                  title="No outstanding receivables"
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full min-w-[58rem] text-left text-sm">
                    <caption className="sr-only">Open invoices and outstanding balances</caption>
                    <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium" scope="col">
                          Invoice
                        </th>
                        <th className="px-4 py-3 font-medium" scope="col">
                          Customer
                        </th>
                        <th className="px-4 py-3 font-medium" scope="col">
                          Due date
                        </th>
                        <th className="px-4 py-3 font-medium" scope="col">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-medium" scope="col">
                          Paid
                        </th>
                        <th className="px-4 py-3 text-right font-medium" scope="col">
                          Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {report.invoices.map((invoice) => (
                        <tr className="hover:bg-muted/30" key={invoice.invoiceId}>
                          <td className="px-4 py-4 font-semibold text-foreground">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-4 py-4 text-foreground">{invoice.customerName}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                            {formatCalendarDate(invoice.dueDate)}
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant={invoice.status === "OVERDUE" ? "destructive" : "secondary"}
                            >
                              {invoice.status === "OVERDUE" ? "Overdue" : "Current"}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-muted-foreground">
                            {formatUsdMinorUnits(invoice.paidMinorUnits)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-foreground">
                            {formatUsdMinorUnits(invoice.outstandingMinorUnits)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}

function getCalendarDate(value: string | string[] | undefined): string | null {
  const dateValue = Array.isArray(value) ? value[0] : value;
  if (dateValue === undefined || !/^\d{4}-\d{2}-\d{2}$/u.test(dateValue)) return null;

  const date = new Date(`${dateValue}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateValue
    ? dateValue
    : null;
}

function formatCalendarDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
