import { vendorSampleData } from "@/components/vendors/vendor-sample-data";
import { VendorsList } from "@/components/vendors/vendors-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendors",
  description: "Manage vendor contacts, categories, and outstanding payables in FinFlow.",
};

export default function VendorsPage() {
  return (
    <section aria-labelledby="vendors-title">
      <header className="space-y-2">
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
      </header>

      <VendorsList vendors={vendorSampleData} />
    </section>
  );
}
