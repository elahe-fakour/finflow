"use client";

import {
  invoiceStatusLabels,
  InvoiceStatusBadge,
} from "@/components/invoices/invoice-status-badge";
import type { InvoiceListItem, InvoiceStatus } from "@/components/invoices/invoice-sample-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { invoiceStatuses } from "@/features/invoices/invoice-types";
import { FileText, FilterX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type InvoiceStatusFilter = "all" | InvoiceStatus;

type InvoicesListProps = {
  invoices: InvoiceListItem[];
};

function InvoicesList({ invoices }: InvoicesListProps) {
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatusFilter>("all");
  const filteredInvoices =
    selectedStatus === "all"
      ? invoices
      : invoices.filter((invoice) => invoice.status === selectedStatus);
  const resultsMessage =
    selectedStatus === "all"
      ? `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`
      : `${filteredInvoices.length} ${invoiceStatusLabels[selectedStatus].toLowerCase()} invoice${
          filteredInvoices.length === 1 ? "" : "s"
        }`;
  const selectedStatusLabel =
    selectedStatus === "all" ? undefined : invoiceStatusLabels[selectedStatus];
  const sentInvoiceCount = invoices.filter((invoice) => invoice.status === "sent").length;
  const overdueInvoiceCount = invoices.filter((invoice) => invoice.status === "overdue").length;

  return (
    <div className="mt-8 space-y-5">
      <section
        aria-labelledby="invoice-status-filter-title"
        className="rounded-[1.5rem] border-2 border-border bg-card px-5 py-4 sm:px-7 sm:py-5"
      >
        <p
          className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          id="invoice-status-filter-title"
        >
          Filter by status
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="group">
          <Button
            aria-pressed={selectedStatus === "all"}
            className="h-11 rounded-xl px-5 text-base"
            onClick={() => setSelectedStatus("all")}
            type="button"
            variant={selectedStatus === "all" ? "default" : "outline"}
          >
            All
          </Button>
          {invoiceStatuses.map((status) => (
            <Button
              aria-pressed={selectedStatus === status}
              className="h-11 rounded-xl px-5 text-base"
              key={status}
              onClick={() => setSelectedStatus(status)}
              type="button"
              variant={selectedStatus === status ? "default" : "outline"}
            >
              {invoiceStatusLabels[status]}
            </Button>
          ))}
        </div>
      </section>

      <div className="flex min-h-20 flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted px-5 py-3 sm:px-7">
        <div>
          <p aria-live="polite" className="text-lg font-semibold text-foreground">
            {resultsMessage}
          </p>
          <p className="text-base font-medium text-secondary-foreground">
            {selectedStatus === "all"
              ? `${sentInvoiceCount} sent · ${overdueInvoiceCount} overdue`
              : `${filteredInvoices.length} ${selectedStatusLabel?.toLowerCase()} invoices`}
          </p>
        </div>
        {selectedStatus !== "all" ? (
          <Button
            onClick={() => setSelectedStatus("all")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Clear filter
          </Button>
        ) : null}
      </div>

      {filteredInvoices.length > 0 ? (
        <section
          aria-label="Invoices"
          className="overflow-hidden rounded-[1.5rem] border-2 border-border bg-card px-5 py-4 sm:px-7 sm:py-6"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[48rem] text-left text-base">
              <caption className="sr-only">Invoice sample data</caption>
              <thead className="border-b-2 border-border text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Invoice
                  </th>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Customer
                  </th>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Due date
                  </th>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Status
                  </th>
                  <th className="px-1 py-4 text-right font-semibold" scope="col">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="border-b border-border px-1 py-5 font-semibold text-foreground">
                      <Link
                        className="underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        href={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="border-b border-border px-1 py-5 font-medium text-secondary-foreground">
                      {invoice.customerName}
                    </td>
                    <td className="border-b border-border px-1 py-5 font-medium text-secondary-foreground">
                      {formatInvoiceDueDate(invoice.dueDate)}
                    </td>
                    <td className="border-b border-border px-1 py-5">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="border-b border-border px-1 py-5 text-right font-semibold tabular-nums text-foreground">
                      {invoice.totalLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {filteredInvoices.map((invoice) => (
              <li
                className="rounded-control border border-border bg-muted/40 p-3"
                key={invoice.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      href={`/invoices/${invoice.id}`}
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {invoice.customerName}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-foreground">
                    {invoice.totalLabel}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <InvoiceStatusBadge status={invoice.status} />
                  <p className="text-sm text-muted-foreground">
                    Due {formatInvoiceDueDate(invoice.dueDate)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Card className="p-5">
          <EmptyState
            action={
              selectedStatusLabel ? (
                <Button onClick={() => setSelectedStatus("all")} type="button" variant="outline">
                  Clear filter
                </Button>
              ) : undefined
            }
            className="mt-2"
            description={
              selectedStatusLabel
                ? `There are no ${selectedStatusLabel.toLowerCase()} invoices in the sample data.`
                : "Invoice records will appear here when they are available."
            }
            icon={selectedStatusLabel ? FilterX : FileText}
            title={selectedStatusLabel ? "No invoices found" : "No invoices yet"}
          />
        </Card>
      )}
    </div>
  );
}

function formatInvoiceDueDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export { InvoicesList };
