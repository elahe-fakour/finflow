import { vendorSampleData } from "@/components/vendors/vendor-sample-data";
import { PageHeading } from "@/components/layout/page-heading";
import {
  vendorBillSampleData,
  vendorExpenseSampleData,
} from "@/components/vendors/vendor-activity-sample-data";
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
import { CircleDollarSign, FilePenLine, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Vendor details",
  description: "View FinFlow vendor details and payable activity.",
};

export function generateStaticParams() {
  return vendorSampleData.map((vendor) => ({ vendorId: vendor.id }));
}

type VendorDetailPageProps = {
  params: Promise<{ vendorId: string }>;
};

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { vendorId } = await params;
  const vendor = vendorSampleData.find((sampleVendor) => sampleVendor.id === vendorId);

  if (!vendor) {
    notFound();
  }

  const expenses = vendorExpenseSampleData.filter((expense) => expense.vendorId === vendor.id);
  const bills = vendorBillSampleData.filter((bill) => bill.vendorId === vendor.id);

  return (
    <section aria-labelledby="vendor-title">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link
          className="underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/vendors"
        >
          Vendors
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{vendor.name}</span>
      </nav>

      <div className="mt-4">
        <PageHeading
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Sample data</Badge>
              <Button asChild size="lg" variant="outline">
                <Link href={`/vendors/${vendor.id}/edit`}>
                  <FilePenLine aria-hidden="true" />
                  Edit vendor
                </Link>
              </Button>
            </div>
          }
          description={`${vendor.contactName} · ${vendor.email}`}
          eyebrow="Vendor profile"
          id="vendor-title"
          title={vendor.name}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Vendor details</CardTitle>
            <CardDescription>Primary contact information for this vendor.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="font-medium text-foreground">{vendor.contactName}</dd>
              </div>
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{vendor.email}</dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium text-foreground">{vendor.category}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Payable summary</CardTitle>
            <CardDescription>Current sample bill activity for this vendor.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Outstanding payable</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {vendor.outstandingPayable}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-muted-foreground">Open bills</dt>
                <dd className="font-medium tabular-nums text-foreground">{vendor.openBills}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Expenses</CardTitle>
            <CardDescription>Recorded expense activity and payment status.</CardDescription>
            <CardAction>
              <Badge variant="outline">Sample data</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <EmptyState
                description={`There are no expenses for ${vendor.name} in the current sample data.`}
                icon={ReceiptText}
                title="No expense history yet"
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <caption className="sr-only">Sample expense history for {vendor.name}</caption>
                  <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Expense
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Date
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium" scope="col">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-foreground">{expense.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{expense.category}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatSampleDate(expense.recordedDate)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={expense.status === "Paid" ? "secondary" : "outline"}>
                            {expense.status}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums text-foreground">
                          {expense.amountLabel}
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
            <CardTitle as="h2">Accounts payable</CardTitle>
            <CardDescription>Open bills, due dates, and outstanding amounts.</CardDescription>
            <CardAction>
              <Badge variant="outline">Sample data</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {bills.length === 0 ? (
              <EmptyState
                description={`There are no open bills for ${vendor.name} in the current sample data.`}
                icon={CircleDollarSign}
                title="No open bills"
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <caption className="sr-only">Open sample bills for {vendor.name}</caption>
                  <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Bill
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Due date
                      </th>
                      <th className="px-4 py-3 text-right font-medium" scope="col">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bills.map((bill) => (
                      <tr key={bill.id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-foreground">{bill.billNumber}</p>
                          <Badge className="mt-2" variant="outline">
                            Open
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {formatSampleDate(bill.dueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-foreground">
                          {bill.amountLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
