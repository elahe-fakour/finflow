import { invoiceSampleData } from "@/components/invoices/invoice-sample-data";
import { InvoicesList } from "@/components/invoices/invoices-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Review invoice status and payment progress in FinFlow.",
};

export default function InvoicesPage() {
  return (
    <section aria-labelledby="invoices-title">
      <header className="space-y-2">
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
      </header>

      <InvoicesList invoices={invoiceSampleData} />
    </section>
  );
}
