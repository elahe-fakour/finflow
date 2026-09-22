import { VendorForm } from "@/components/vendors/vendor-form";
import { vendorSampleData } from "@/components/vendors/vendor-sample-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit vendor",
  description: "Validate updates to a FinFlow vendor record.",
};

export function generateStaticParams() {
  return vendorSampleData.map((vendor) => ({ vendorId: vendor.id }));
}

type EditVendorPageProps = {
  params: Promise<{ vendorId: string }>;
};

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const { vendorId } = await params;
  const vendor = vendorSampleData.find((sampleVendor) => sampleVendor.id === vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <section aria-labelledby="edit-vendor-title">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Vendor relationships</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="edit-vendor-title"
          >
            Edit {vendor.name}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Validate changes to this vendor&apos;s details before persistence is available.
          </p>
        </div>
        <Badge className="w-fit" variant="outline">
          Validation preview
        </Badge>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <VendorForm
          initialValues={{
            name: vendor.name,
            contactName: vendor.contactName,
            email: vendor.email,
            category: vendor.category,
          }}
          mode="edit"
          returnHref={`/vendors/${vendor.id}`}
        />

        <Card>
          <CardHeader>
            <CardTitle as="h2">Unsaved changes</CardTitle>
            <CardDescription>Changes are held only in this browser session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 rounded-control border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <p>
                After you edit a field, Cancel asks before discarding changes. Refreshing or closing
                the browser also triggers its native unsaved-changes warning.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
