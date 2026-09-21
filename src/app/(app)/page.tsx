import { CashFlowChart, type CashFlowDataPoint } from "@/components/dashboard/cash-flow-chart";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import {
  ExpenseBreakdownChart,
  type ExpenseBreakdownDataPoint,
} from "@/components/dashboard/expense-breakdown-chart";
import { QuickActionsPanel, type QuickAction } from "@/components/dashboard/quick-actions-panel";
import {
  RecentInvoicesPanel,
  type RecentInvoice,
} from "@/components/dashboard/recent-invoices-panel";
import type { Metadata } from "next";
import {
  CircleDollarSign,
  FilePlus2,
  Landmark,
  ReceiptText,
  Upload,
  UserPlus,
  WalletCards,
} from "lucide-react";

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

const expenseBreakdownSampleData: ExpenseBreakdownDataPoint[] = [
  { category: "Payroll", amountCents: 315_000, color: "#0f766e" },
  { category: "Contractors", amountCents: 195_000, color: "#0284c7" },
  { category: "Software", amountCents: 122_000, color: "#7c3aed" },
  { category: "Marketing", amountCents: 104_000, color: "#d97706" },
  { category: "Other", amountCents: 106_000, color: "#db2777" },
];

const recentInvoices: RecentInvoice[] = [
  {
    invoiceNumber: "INV-2026-0182",
    customer: "Acme Ltd.",
    dueDate: "Sep 22, 2026",
    status: "Sent",
    amount: "$1,250.00",
  },
  {
    invoiceNumber: "INV-2026-0181",
    customer: "Northstar Creative",
    dueDate: "Sep 18, 2026",
    status: "Overdue",
    amount: "$2,480.00",
  },
  {
    invoiceNumber: "INV-2026-0180",
    customer: "Pine & Co.",
    dueDate: "Sep 15, 2026",
    status: "Paid",
    amount: "$980.00",
  },
  {
    invoiceNumber: "INV-2026-0179",
    customer: "Brightline Studio",
    dueDate: "Sep 30, 2026",
    status: "Draft",
    amount: "$1,560.00",
  },
];

const quickActions: QuickAction[] = [
  {
    label: "Create invoice",
    description: "Issue a new customer invoice",
    icon: FilePlus2,
  },
  {
    label: "Add customer",
    description: "Create a customer record",
    icon: UserPlus,
  },
  {
    label: "Record expense",
    description: "Capture a business expense",
    icon: ReceiptText,
  },
  {
    label: "Import transactions",
    description: "Bring in bank activity",
    icon: Upload,
  },
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

      <section aria-label="Expense breakdown" className="mt-6">
        <ExpenseBreakdownChart data={expenseBreakdownSampleData} />
      </section>

      <section
        aria-label="Dashboard activity"
        className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)] xl:items-start"
      >
        <RecentInvoicesPanel invoices={recentInvoices} />
        <QuickActionsPanel actions={quickActions} />
      </section>
    </section>
  );
}
