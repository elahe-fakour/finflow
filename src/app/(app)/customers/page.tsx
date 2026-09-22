import { customerSampleData } from "@/components/customers/customer-sample-data";
import { CustomersList } from "@/components/customers/customers-list";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage customer contacts and outstanding balances in FinFlow.",
};

export default function CustomersPage() {
  return (
    <section aria-labelledby="customers-title">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
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
        </div>
        <Button asChild className="w-full sm:w-auto" size="lg">
          <Link href="/customers/new">
            <UserPlus aria-hidden="true" />
            Add customer
          </Link>
        </Button>
      </header>

      <CustomersList customers={customerSampleData} />
    </section>
  );
}
