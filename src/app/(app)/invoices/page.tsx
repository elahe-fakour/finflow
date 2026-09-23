import { invoiceSampleData } from "@/components/invoices/invoice-sample-data";
import { InvoicesList } from "@/components/invoices/invoices-list";
import { Button } from "@/components/ui/button";
import { FilePlus2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Review invoice status and payment progress in FinFlow.",
};

export default function InvoicesPage() {
  return (
    <section aria-labelledby="invoices-title">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Sales operations</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="invoices-title"
          >
            Invoices
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review sample invoice activity, due dates, and payment status.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" size="lg">
          <Link href="/invoices/new">
            <FilePlus2 aria-hidden="true" />
            New invoice
          </Link>
        </Button>
      </header>

      <InvoicesList invoices={invoiceSampleData} />
    </section>
  );
}
