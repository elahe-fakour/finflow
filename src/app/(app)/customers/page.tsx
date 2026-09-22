import { CustomersList, type Customer } from "@/components/customers/customers-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage customer contacts and outstanding balances in FinFlow.",
};

const customers: Customer[] = [
  {
    id: "customer-acme",
    name: "Acme Ltd.",
    contactName: "Maya Patel",
    email: "billing@acme.example",
    openInvoices: 1,
    outstandingBalance: "$1,250.00",
  },
  {
    id: "customer-northstar",
    name: "Northstar Creative",
    contactName: "Jordan Lee",
    email: "accounts@northstar.example",
    openInvoices: 1,
    outstandingBalance: "$5,990.00",
  },
  {
    id: "customer-pine",
    name: "Pine & Co.",
    contactName: "Avery Morgan",
    email: "finance@pine.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
  {
    id: "customer-brightline",
    name: "Brightline Studio",
    contactName: "Sam Rivera",
    email: "hello@brightline.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
  {
    id: "customer-greenfield",
    name: "Greenfield Legal",
    contactName: "Taylor Brooks",
    email: "billing@greenfield.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
  {
    id: "customer-cascade",
    name: "Cascade Health",
    contactName: "Riley Chen",
    email: "ap@cascade.example",
    openInvoices: 0,
    outstandingBalance: "$0.00",
  },
];

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

      <CustomersList customers={customers} />
    </section>
  );
}
