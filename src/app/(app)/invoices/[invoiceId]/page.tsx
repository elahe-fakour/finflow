import { invoiceDetailSampleData } from "@/components/invoices/invoice-sample-data";
import { InvoiceDetailWorkspace } from "@/components/invoices/invoice-detail-workspace";
import type { Metadata } from "next";
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

  return <InvoiceDetailWorkspace invoice={invoice} />;
}
