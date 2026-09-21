import { CashFlowChart, type CashFlowDataPoint } from "@/components/dashboard/cash-flow-chart";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import type { Metadata } from "next";
import { CircleDollarSign, Landmark, ReceiptText, WalletCards } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "An overview of your FinFlow financial operations.",
};

const dashboardMetrics = [
  {
    label: "Total income",
    value: "$24,850.00",
    description: "Current period · sample data",
    icon: CircleDollarSign,
  },
  {
    label: "Total expenses",
    value: "$8,420.00",
    description: "Current period · sample data",
    icon: ReceiptText,
  },
  {
    label: "Outstanding invoices",
    value: "$7,240.00",
    description: "4 invoices awaiting payment · sample data",
    icon: WalletCards,
  },
  {
    label: "Cash balance",
    value: "$31,620.00",
    description: "Across 3 accounts · sample data",
    icon: Landmark,
  },
];

const cashFlowSampleData: CashFlowDataPoint[] = [
  { period: "Apr", netCashFlowCents: 425_000 },
  { period: "May", netCashFlowCents: 510_000 },
  { period: "Jun", netCashFlowCents: 378_000 },
  { period: "Jul", netCashFlowCents: 642_000 },
  { period: "Aug", netCashFlowCents: 584_000 },
  { period: "Sep", netCashFlowCents: 711_000 },
];

export default function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-title">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Financial overview</p>
        <h1
          className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
          id="dashboard-title"
        >
          Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Monitor your business finances and stay on top of your daily operations.
        </p>
      </header>

      <section aria-labelledby="dashboard-metrics-title" className="mt-8">
        <h2 className="sr-only" id="dashboard-metrics-title">
          Key financial metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map((metric) => (
            <DashboardKpiCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section aria-label="Cash flow" className="mt-6">
        <CashFlowChart data={cashFlowSampleData} />
      </section>
    </section>
  );
}
