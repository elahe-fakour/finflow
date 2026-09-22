"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Search, SearchX, Users } from "lucide-react";
import { useState } from "react";

type Customer = {
  contactName: string;
  email: string;
  id: string;
  name: string;
  openInvoices: number;
  outstandingBalance: string;
};

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
    <Card className="mt-8">
      <CardHeader>
        <CardTitle as="h2">All customers</CardTitle>
        <CardDescription>Search customer contacts and outstanding balances.</CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <label className="sr-only" htmlFor="customer-search">
              Search customers
            </label>
            <Input
              aria-describedby="customer-search-results"
              className="h-10 pl-9"
              id="customer-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search customers"
              type="search"
              value={searchQuery}
            />
          </div>
          <p
            aria-live="polite"
            className="text-sm text-muted-foreground"
            id="customer-search-results"
          >
            {resultsMessage}
          </p>
        </div>

        {filteredCustomers.length > 0 ? (
          <>
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <caption className="sr-only">Customer sample data</caption>
                <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="pb-3 font-medium" scope="col">
                      Customer
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Contact
                    </th>
                    <th className="pb-3 text-right font-medium" scope="col">
                      Open invoices
                    </th>
                    <th className="pb-3 text-right font-medium" scope="col">
                      Outstanding balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="py-4 pr-4">
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="mt-0.5 text-muted-foreground">{customer.email}</p>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{customer.contactName}</td>
                      <td className="py-4 pr-4 text-right tabular-nums text-foreground">
                        {customer.openInvoices}
                      </td>
                      <td className="py-4 text-right font-medium tabular-nums text-foreground">
                        {customer.outstandingBalance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-6 space-y-3 md:hidden">
              {filteredCustomers.map((customer) => (
                <li
                  className="rounded-control border border-border bg-muted/40 p-3"
                  key={customer.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{customer.name}</p>
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
          </>
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
      </CardContent>
    </Card>
  );
}

export { CustomersList, type Customer };
