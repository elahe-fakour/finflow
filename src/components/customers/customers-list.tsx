"use client";

import type { Customer } from "@/components/customers/customer-sample-data";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Search, SearchX, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type CustomersListProps = {
  customers: Customer[];
};

function customerMatchesSearch(customer: Customer, query: string) {
  return [customer.name, customer.contactName, customer.email].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function CustomersList({ customers }: CustomersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCustomers = normalizedQuery
    ? customers.filter((customer) => customerMatchesSearch(customer, normalizedQuery))
    : customers;
  const resultsMessage = normalizedQuery
    ? `${filteredCustomers.length} customer${filteredCustomers.length === 1 ? "" : "s"} found`
    : `${customers.length} customer${customers.length === 1 ? "" : "s"}`;

  return (
    <div className="mt-8 space-y-5">
      <section
        aria-label="Customer search"
        className="rounded-[1.5rem] border-2 border-border bg-card px-5 py-4 sm:px-7 sm:py-5"
      >
        <label
          className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          htmlFor="customer-search"
        >
          Search customers
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-describedby="customer-search-results"
              className="pl-11"
              id="customer-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search customers"
              type="search"
              value={searchQuery}
            />
          </div>
        </div>
      </section>

      <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-5 py-3 sm:px-7">
        <p
          aria-live="polite"
          className="text-lg font-semibold text-foreground"
          id="customer-search-results"
        >
          {resultsMessage}
        </p>
        <Badge className="border border-border bg-card text-secondary-foreground" variant="outline">
          Sample data
        </Badge>
      </div>

      {filteredCustomers.length > 0 ? (
        <section
          aria-label="Customers"
          className="overflow-hidden rounded-[1.5rem] border-2 border-border bg-card px-5 py-4 sm:px-7 sm:py-6"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[42rem] text-left text-base">
              <caption className="sr-only">Customer sample data</caption>
              <thead className="border-b-2 border-border text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Customer
                  </th>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Contact
                  </th>
                  <th className="px-1 py-4 text-right font-semibold" scope="col">
                    Open invoices
                  </th>
                  <th className="px-1 py-4 text-right font-semibold" scope="col">
                    Outstanding balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="border-b border-border px-1 py-5">
                      <Link
                        className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        href={`/customers/${customer.id}`}
                      >
                        {customer.name}
                      </Link>
                      <p className="mt-0.5 text-secondary-foreground">{customer.email}</p>
                    </td>
                    <td className="border-b border-border px-1 py-5 font-medium text-secondary-foreground">
                      {customer.contactName}
                    </td>
                    <td className="border-b border-border px-1 py-5 text-right tabular-nums text-secondary-foreground">
                      {customer.openInvoices}
                    </td>
                    <td className="border-b border-border px-1 py-5 text-right font-semibold tabular-nums text-foreground">
                      {customer.outstandingBalance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {filteredCustomers.map((customer) => (
              <li
                className="rounded-control border border-border bg-muted/40 p-3"
                key={customer.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      href={`/customers/${customer.id}`}
                    >
                      {customer.name}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-foreground">
                    {customer.outstandingBalance}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <p className="truncate text-muted-foreground">{customer.contactName}</p>
                  <p className="shrink-0 text-muted-foreground">{customer.openInvoices} open</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState
          className="mt-6"
          description={
            normalizedQuery
              ? `No customer matches “${searchQuery.trim()}”. Try a different name or email address.`
              : "Customer records will appear here when they are available."
          }
          icon={normalizedQuery ? SearchX : Users}
          title={normalizedQuery ? "No customers found" : "No customers yet"}
        />
      )}
    </div>
  );
}

export { CustomersList };
