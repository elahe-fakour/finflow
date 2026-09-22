import { customerSampleData } from "@/components/customers/customer-sample-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CircleDollarSign, FileText } from "lucide-react";
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
        <Badge className="w-fit" variant="outline">
          Sample data
        </Badge>
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
            <CardDescription>Invoice history for {customer.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              description="Detailed invoice records will appear here when invoice management is introduced."
              icon={FileText}
              title="Invoice history is coming soon"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Payments</CardTitle>
            <CardDescription>Payment activity and allocation history.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              description="Recorded payments and their invoice allocations will appear here in a later milestone."
              icon={CircleDollarSign}
              title="Payment history is coming soon"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
