import { CustomerForm } from "@/components/customers/customer-form";
import { customerSampleData } from "@/components/customers/customer-sample-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit customer",
  description: "Validate updates to a FinFlow customer record.",
};

export function generateStaticParams() {
  return customerSampleData.map((customer) => ({ customerId: customer.id }));
}

type EditCustomerPageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { customerId } = await params;
  const customer = customerSampleData.find((sampleCustomer) => sampleCustomer.id === customerId);

  if (!customer) {
    notFound();
  }

  return (
    <section aria-labelledby="edit-customer-title">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Customer relationships</p>
          <h1
            className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
            id="edit-customer-title"
          >
            Edit {customer.name}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Validate changes to this customer&apos;s contact details before persistence is
            available.
          </p>
        </div>
        <Badge className="w-fit" variant="outline">
          Validation preview
        </Badge>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <CustomerForm
          initialValues={{
            name: customer.name,
            contactName: customer.contactName,
            email: customer.email,
          }}
          mode="edit"
          returnHref={`/customers/${customer.id}`}
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
