import { VendorForm } from "@/components/vendors/vendor-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New vendor",
  description: "Validate details for a new FinFlow vendor record.",
};

export default function NewVendorPage() {
  return (
    <section aria-labelledby="new-vendor-title">
      <Button asChild size="sm" variant="ghost">
        <Link href="/vendors">
          <ArrowLeft aria-hidden="true" />
          Back to vendors
        </Link>
      </Button>

      <header className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Vendor relationships</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="new-vendor-title"
          >
            New vendor
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Validate a new vendor&apos;s details before vendor persistence is available.
          </p>
        </div>
        <Badge className="w-fit" variant="outline">
          Validation preview
        </Badge>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <VendorForm mode="create" returnHref="/vendors" />

        <Card>
          <CardHeader>
            <CardTitle as="h2">What happens next</CardTitle>
            <CardDescription>This form currently validates data in the browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 rounded-control border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
              <Database aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Saving vendor records requires the backend and database work planned for a later
                phase. No record is created by this screen yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
