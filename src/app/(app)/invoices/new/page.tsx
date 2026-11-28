import { customerSampleData } from "@/components/customers/customer-sample-data";
import { PageHeading } from "@/components/layout/page-heading";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New invoice",
  description: "Set the initial details for a new FinFlow invoice.",
};

export default function NewInvoicePage() {
  return (
    <section aria-labelledby="new-invoice-title">
      <Button asChild size="sm" variant="ghost">
        <Link href="/invoices">
          <ArrowLeft aria-hidden="true" />
          Back to invoices
        </Link>
      </Button>

      <div className="mt-6">
        <PageHeading
          action={
            <Badge className="w-fit" variant="outline">
              Editor preview
            </Badge>
          }
          description="Add billable line items and review live totals before invoice persistence is available."
          eyebrow="Sales operations"
          id="new-invoice-title"
          title="New invoice"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <InvoiceEditor customers={customerSampleData} />

        <Card>
          <CardHeader>
            <CardTitle as="h2">What happens next</CardTitle>
            <CardDescription>This screen collects input only in the browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 rounded-control border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
              <Database aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                This editor validates line inputs and calculates live sample totals in the browser.
                Creating an invoice draft requires the API and database introduced in a later phase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
