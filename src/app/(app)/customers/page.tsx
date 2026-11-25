import { customerSampleData } from "@/components/customers/customer-sample-data";
import { CustomersList } from "@/components/customers/customers-list";
import { PageHeading } from "@/components/layout/page-heading";
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
      <PageHeading
        action={
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link href="/customers/new">
              <UserPlus aria-hidden="true" />
              Add customer
            </Link>
          </Button>
        }
        description="Manage customer contacts, invoice activity, and outstanding balances."
        eyebrow="Customer relationships"
        id="customers-title"
        title="Customers"
      />

      <CustomersList customers={customerSampleData} />
    </section>
  );
}
