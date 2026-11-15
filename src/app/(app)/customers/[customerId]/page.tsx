import { customerSampleData } from "@/components/customers/customer-sample-data";
import { invoiceDetailSampleData } from "@/components/invoices/invoice-sample-data";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CircleDollarSign, FilePenLine, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Customer details",
  description: "View FinFlow customer details and financial activity.",
};

export function generateStaticParams() {
  return customerSampleData.map((customer) => ({ customerId: customer.id }));
}

export default async function CustomerDetailPage(props: PageProps<"/customers/[customerId]">) {
  const { customerId } = await props.params;
  const customer = customerSampleData.find((sampleCustomer) => sampleCustomer.id === customerId);

  if (!customer) {
    notFound();
  }

  const invoices = invoiceDetailSampleData.filter((invoice) => invoice.customerId === customer.id);
  const payments = invoices
    .flatMap((invoice) =>
      invoice.paymentHistory.map((payment) => ({
        ...payment,
        invoiceNumber: invoice.invoiceNumber,
      })),
    )
    .sort((first, second) => second.receivedAt.localeCompare(first.receivedAt));

  return (
    <section aria-labelledby="customer-title">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link
          className="underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/customers"
        >
          Customers
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{customer.name}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Customer profile</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="customer-title"
          >
            {customer.name}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {customer.contactName} · {customer.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">Sample data</Badge>
          <Button asChild size="lg" variant="outline">
            <Link href={`/customers/${customer.id}/edit`}>
              <FilePenLine aria-hidden="true" />
              Edit customer
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Customer details</CardTitle>
            <CardDescription>Primary contact information for this customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="font-medium text-foreground">{customer.contactName}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{customer.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Account summary</CardTitle>
            <CardDescription>Current sample balance and invoice activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Outstanding balance</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {customer.outstandingBalance}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Open invoices</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {customer.openInvoices}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Invoices</CardTitle>
            <CardDescription>Invoice status, due dates, and outstanding amounts.</CardDescription>
            <CardAction>
              <Badge variant="outline">Sample data</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <EmptyState
                description={`There are no invoices for ${customer.name} in the current sample data.`}
                icon={FileText}
                title="No invoice history yet"
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <caption className="sr-only">Sample invoices for {customer.name}</caption>
                  <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Invoice
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Due date
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium" scope="col">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-4">
                          <Link
                            className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            href={`/invoices/${invoice.id}`}
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatSampleDate(invoice.dueDate)}
                        </td>
                        <td className="px-4 py-4">
                          <InvoiceStatusBadge status={invoice.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums text-foreground">
                          {invoice.totalsDisplay.outstandingLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Payments</CardTitle>
            <CardDescription>Received amounts linked to this customer’s invoices.</CardDescription>
            <CardAction>
              <Badge variant="outline">Sample data</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <EmptyState
                description={`There are no recorded payments for ${customer.name} in the current sample data.`}
                icon={CircleDollarSign}
                title="No payments recorded"
              />
            ) : (
              <ul className="divide-y divide-border">
                {payments.map((payment) => (
                  <li
                    className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                    key={payment.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        href={`/invoices/${payment.invoiceId}`}
                      >
                        {payment.invoiceNumber}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {payment.receivedAtLabel} · {payment.methodLabel}
                      </p>
                      {payment.reference ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reference: {payment.reference}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-success">
                      {payment.amountLabel}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function formatSampleDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
