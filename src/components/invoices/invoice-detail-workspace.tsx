"use client";

import type {
  InvoiceDetailItem,
  PaymentHistoryItem,
} from "@/components/invoices/invoice-sample-data";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import {
  RecordPaymentForm,
  type ValidatedPaymentInput,
} from "@/components/invoices/record-payment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deriveInvoiceFinancialState } from "@/features/invoices/invoice-status";
import { formatMoney } from "@/features/invoices/money";
import { CircleCheck, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const paymentMethodLabels = {
  "bank-transfer": "Bank transfer",
  card: "Card",
  cash: "Cash",
  other: "Other",
} as const;

type InvoiceDetailWorkspaceProps = {
  invoice: InvoiceDetailItem;
};

function formatReceivedDate(dateOnly: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${dateOnly}T12:00:00.000Z`));
}

function PaymentHistory({
  invoiceNumber,
  paymentHistory,
}: Pick<InvoiceDetailItem, "invoiceNumber"> & { paymentHistory: PaymentHistoryItem[] }) {
  if (paymentHistory.length === 0) {
    return (
      <EmptyState
        description="Payments allocated to this invoice will appear here when they are recorded."
        icon={CircleDollarSign}
        title="No payments recorded"
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <caption className="sr-only">Payment history for {invoiceNumber}</caption>
          <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="pb-3 font-medium" scope="col">
                Received
              </th>
              <th className="pb-3 font-medium" scope="col">
                Method
              </th>
              <th className="pb-3 font-medium" scope="col">
                Reference
              </th>
              <th className="pb-3 text-right font-medium" scope="col">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paymentHistory.map((payment) => (
              <tr key={payment.id}>
                <td className="py-4 pr-4 tabular-nums text-muted-foreground">
                  {payment.receivedAtLabel}
                </td>
                <td className="py-4 pr-4 text-foreground">{payment.methodLabel}</td>
                <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
                  {payment.reference ?? "—"}
                </td>
                <td className="py-4 text-right font-medium tabular-nums text-foreground">
                  {payment.amountLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {paymentHistory.map((payment) => (
          <li className="rounded-control border border-border bg-muted/40 p-3" key={payment.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{payment.methodLabel}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{payment.receivedAtLabel}</p>
              </div>
              <p className="font-medium tabular-nums text-foreground">{payment.amountLabel}</p>
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {payment.reference ?? "No reference"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

function InvoiceDetailWorkspace({ invoice }: InvoiceDetailWorkspaceProps) {
  const [financialState, setFinancialState] = useState({
    outstanding: invoice.totals.outstanding,
    paid: invoice.totals.paid,
    status: invoice.status,
  });
  const [paymentHistory, setPaymentHistory] = useState(invoice.paymentHistory);
  const [nextPaymentNumber, setNextPaymentNumber] = useState(invoice.paymentHistory.length + 1);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handlePaymentValidated = (payment: ValidatedPaymentInput) => {
    const nextPayment: PaymentHistoryItem = {
      amount: payment.amount,
      amountLabel: formatMoney(payment.amount),
      id: `payment-preview-${nextPaymentNumber}`,
      invoiceId: invoice.id,
      method: payment.method,
      methodLabel: paymentMethodLabels[payment.method],
      receivedAt: `${payment.receivedAt}T12:00:00.000Z`,
      receivedAtLabel: formatReceivedDate(payment.receivedAt),
      reference: payment.reference,
      workspaceId: invoice.workspaceId,
    };
    const nextPaymentHistory = [...paymentHistory, nextPayment];
    const nextFinancialState = deriveInvoiceFinancialState({
      asOfDate: payment.receivedAt,
      currentStatus: financialState.status,
      dueDate: invoice.dueDate,
      invoiceTotal: invoice.totals.total,
      payments: nextPaymentHistory,
    });

    setPaymentHistory(nextPaymentHistory);
    setFinancialState(nextFinancialState);
    setNextPaymentNumber((currentNumber) => currentNumber + 1);
    setConfirmation(
      `${formatMoney(payment.amount)} payment preview added. This browser session now shows ${formatMoney(nextFinancialState.outstanding)} outstanding.`,
    );
  };

  return (
    <section aria-labelledby="invoice-title">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link
          className="underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/invoices"
        >
          Invoices
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{invoice.invoiceNumber}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Sales operations</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="invoice-title"
          >
            {invoice.invoiceNumber}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {invoice.customerName} · Due {invoice.dueDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">Sample data</Badge>
          <InvoiceStatusBadge status={financialState.status} />
        </div>
      </header>

      {confirmation ? (
        <div
          aria-live="polite"
          className="mt-6 flex gap-3 rounded-control border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-foreground"
          role="status"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>{confirmation} Refreshing this page discards the preview.</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Invoice details</CardTitle>
            <CardDescription>Key details for this sample invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Customer</dt>
                <dd className="font-medium text-foreground">{invoice.customerName}</dd>
              </div>
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Issue date</dt>
                <dd className="font-medium tabular-nums text-foreground">{invoice.issueDate}</dd>
              </div>
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Due date</dt>
                <dd className="font-medium tabular-nums text-foreground">{invoice.dueDate}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Currency</dt>
                <dd className="font-medium text-foreground">{invoice.currency}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Totals</CardTitle>
            <CardDescription>Calculated from the current browser-session preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatMoney(invoice.totals.subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatMoney(invoice.totals.discountTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatMoney(invoice.totals.taxTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="text-base font-semibold tabular-nums text-foreground">
                  {formatMoney(invoice.totals.total)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-medium tabular-nums text-success">
                  {formatMoney(financialState.paid)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-foreground">Outstanding</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {formatMoney(financialState.outstanding)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <RecordPaymentForm
          existingPayments={paymentHistory}
          invoiceNumber={invoice.invoiceNumber}
          invoiceStatus={financialState.status}
          invoiceTotal={invoice.totals.total}
          onPaymentValidated={handlePaymentValidated}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle as="h2">Payment history</CardTitle>
          <CardDescription>
            Payments allocated to this invoice in this browser preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentHistory invoiceNumber={invoice.invoiceNumber} paymentHistory={paymentHistory} />
        </CardContent>
      </Card>
    </section>
  );
}

export { InvoiceDetailWorkspace };
