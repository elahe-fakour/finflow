import { customerSampleData } from "@/components/customers/customer-sample-data";
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

      <header className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Sales operations</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="new-invoice-title"
          >
            New invoice
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Add billable line items and review live totals before invoice persistence is available.
          </p>
        </div>
        <Badge className="w-fit" variant="outline">
          Editor preview
        </Badge>
      </header>

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
