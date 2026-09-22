"use client";

import {
  invoiceStatusLabels,
  InvoiceStatusBadge,
} from "@/components/invoices/invoice-status-badge";
import type { InvoiceListItem, InvoiceStatus } from "@/components/invoices/invoice-sample-data";
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

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle as="h2">All invoices</CardTitle>
        <CardDescription>Review the current sample invoice workflow by status.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <section aria-labelledby="invoice-status-filter-title">
          <p className="text-sm font-medium text-foreground" id="invoice-status-filter-title">
            Filter by status
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group">
            <Button
              aria-pressed={selectedStatus === "all"}
              onClick={() => setSelectedStatus("all")}
              size="sm"
              type="button"
              variant={selectedStatus === "all" ? "default" : "outline"}
            >
              All
            </Button>
            {invoiceStatuses.map((status) => (
              <Button
                aria-pressed={selectedStatus === status}
                key={status}
                onClick={() => setSelectedStatus(status)}
                size="sm"
                type="button"
                variant={selectedStatus === status ? "default" : "outline"}
              >
                {invoiceStatusLabels[status]}
              </Button>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {resultsMessage}
          </p>
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
          <>
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <caption className="sr-only">Invoice sample data</caption>
                <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="pb-3 font-medium" scope="col">
                      Invoice
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Customer
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Issue date
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Due date
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium" scope="col">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="py-4 pr-4 font-medium text-foreground">
                        <Link
                          className="underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          href={`/invoices/${invoice.id}`}
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{invoice.customerName}</td>
                      <td className="py-4 pr-4 text-muted-foreground">{invoice.issueDate}</td>
                      <td className="py-4 pr-4 text-muted-foreground">{invoice.dueDate}</td>
                      <td className="py-4 pr-4">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="py-4 text-right font-medium tabular-nums text-foreground">
                        {invoice.totalLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-6 space-y-3 md:hidden">
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
                    <p className="text-sm text-muted-foreground">Due {invoice.dueDate}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            action={
              selectedStatusLabel ? (
                <Button onClick={() => setSelectedStatus("all")} type="button" variant="outline">
                  Clear filter
                </Button>
              ) : undefined
            }
            className="mt-6"
            description={
              selectedStatusLabel
                ? `There are no ${selectedStatusLabel.toLowerCase()} invoices in the sample data.`
                : "Invoice records will appear here when they are available."
            }
            icon={selectedStatusLabel ? FilterX : FileText}
            title={selectedStatusLabel ? "No invoices found" : "No invoices yet"}
          />
        )}
      </CardContent>
    </Card>
  );
}

export { InvoicesList };
