import { invoiceDetailSampleData } from "@/components/invoices/invoice-sample-data";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { RecordPaymentForm } from "@/components/invoices/record-payment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CircleDollarSign } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Invoice details",
  description: "View a FinFlow invoice, its sample totals, and payment history.",
};

export function generateStaticParams() {
  return invoiceDetailSampleData.map((invoice) => ({ invoiceId: invoice.id }));
}

type InvoiceDetailPageProps = {
  params: Promise<{ invoiceId: string }>;
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const invoice = invoiceDetailSampleData.find((sampleInvoice) => sampleInvoice.id === invoiceId);

  if (!invoice) {
    notFound();
  }

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
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </header>

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
            <CardDescription>Sample totals shown without live calculations.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {invoice.totalsDisplay.subtotalLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {invoice.totalsDisplay.discountTotalLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {invoice.totalsDisplay.taxTotalLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="text-base font-semibold tabular-nums text-foreground">
                  {invoice.totalsDisplay.totalLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-medium tabular-nums text-success">
                  {invoice.totalsDisplay.paidLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-foreground">Outstanding</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {invoice.totalsDisplay.outstandingLabel}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <RecordPaymentForm
          existingPayments={invoice.paymentHistory}
          invoiceNumber={invoice.invoiceNumber}
          invoiceStatus={invoice.status}
          invoiceTotal={invoice.totals.total}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle as="h2">Payment history</CardTitle>
          <CardDescription>Payments allocated to this invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoice.paymentHistory.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[42rem] text-left text-sm">
                  <caption className="sr-only">Payment history for {invoice.invoiceNumber}</caption>
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
                    {invoice.paymentHistory.map((payment) => (
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
                {invoice.paymentHistory.map((payment) => (
                  <li
                    className="rounded-control border border-border bg-muted/40 p-3"
                    key={payment.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{payment.methodLabel}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {payment.receivedAtLabel}
                        </p>
                      </div>
                      <p className="font-medium tabular-nums text-foreground">
                        {payment.amountLabel}
                      </p>
                    </div>
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      {payment.reference ?? "No reference"}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState
              description="Payments allocated to this invoice will appear here when they are recorded."
              icon={CircleDollarSign}
              title="No payments recorded"
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
