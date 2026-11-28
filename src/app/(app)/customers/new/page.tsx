import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New customer",
  description: "Validate details for a new FinFlow customer record.",
};

export default function NewCustomerPage() {
  return (
    <section aria-labelledby="new-customer-title">
      <Button asChild size="sm" variant="ghost">
        <Link href="/customers">
          <ArrowLeft aria-hidden="true" />
          Back to customers
        </Link>
      </Button>

      <div className="mt-6">
        <PageHeading
          action={
            <Badge className="w-fit" variant="outline">
              Validation preview
            </Badge>
          }
          description="Validate a new customer's contact details before customer persistence is available."
          eyebrow="Customer relationships"
          id="new-customer-title"
          title="New customer"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <CustomerForm mode="create" returnHref="/customers" />

        <Card>
          <CardHeader>
            <CardTitle as="h2">What happens next</CardTitle>
            <CardDescription>This form currently validates data in the browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 rounded-control border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
              <Database aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Saving customer records requires the backend and database work planned for a later
                phase. No record is created by this screen yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
