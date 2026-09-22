import { vendorSampleData } from "@/components/vendors/vendor-sample-data";
import { VendorsList } from "@/components/vendors/vendors-list";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vendors",
  description: "Manage vendor contacts, categories, and outstanding payables in FinFlow.",
};

export default function VendorsPage() {
  return (
    <section aria-labelledby="vendors-title">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Vendor relationships</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="vendors-title"
          >
            Vendors
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review vendor contacts, expense categories, and outstanding payables.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" size="lg">
          <Link href="/vendors/new">
            <UserPlus aria-hidden="true" />
            Add vendor
          </Link>
        </Button>
      </header>

      <VendorsList vendors={vendorSampleData} />
    </section>
  );
}
