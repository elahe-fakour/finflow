import { vendorSampleData } from "@/components/vendors/vendor-sample-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CircleDollarSign, ReceiptText } from "lucide-react";
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

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Vendor profile</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="vendor-title"
          >
            {vendor.name}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {vendor.contactName} · {vendor.email}
          </p>
        </div>
        <Badge className="w-fit" variant="outline">
          Sample data
        </Badge>
      </header>

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
            <CardDescription>Expense activity associated with {vendor.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              description="Expense records for this vendor will appear here when expense management is introduced."
              icon={ReceiptText}
              title="Expense history is coming soon"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Accounts payable</CardTitle>
            <CardDescription>Bill due dates and payment allocation history.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              description="Bill details, due dates, and payable payment history will appear here in a later milestone."
              icon={CircleDollarSign}
              title="Payable details are coming soon"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
