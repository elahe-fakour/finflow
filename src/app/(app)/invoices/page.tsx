import { invoiceSampleData } from "@/components/invoices/invoice-sample-data";
import { InvoicesList } from "@/components/invoices/invoices-list";
import { PageHeading } from "@/components/layout/page-heading";
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
      <PageHeading
        action={
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link href="/invoices/new">
              <FilePlus2 aria-hidden="true" />
              New invoice
            </Link>
          </Button>
        }
        description="Review sample invoice activity, due dates, and payment status."
        eyebrow="Sales operations"
        id="invoices-title"
        title="Invoices"
      />

      <InvoicesList invoices={invoiceSampleData} />
    </section>
  );
}
