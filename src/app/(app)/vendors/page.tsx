import { vendorSampleData } from "@/components/vendors/vendor-sample-data";
import { VendorsList } from "@/components/vendors/vendors-list";
import { PageHeading } from "@/components/layout/page-heading";
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
      <PageHeading
        action={
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link href="/vendors/new">
              <UserPlus aria-hidden="true" />
              Add vendor
            </Link>
          </Button>
        }
        description="Review vendor contacts, expense categories, and outstanding payables."
        eyebrow="Vendor relationships"
        id="vendors-title"
        title="Vendors"
      />

      <VendorsList vendors={vendorSampleData} />
    </section>
  );
}
