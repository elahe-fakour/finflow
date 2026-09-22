import { customerSampleData } from "@/components/customers/customer-sample-data";
import { CustomersList } from "@/components/customers/customers-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage customer contacts and outstanding balances in FinFlow.",
};

export default function CustomersPage() {
  return (
    <section aria-labelledby="customers-title">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Customer relationships</p>
        <h1
          className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
          id="customers-title"
        >
          Customers
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Manage customer contacts, invoice activity, and outstanding balances.
        </p>
      </header>

      <CustomersList customers={customerSampleData} />
    </section>
  );
}
