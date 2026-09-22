import type { Invoice, InvoiceStatus } from "@/features/invoices/invoice-types";

type InvoiceListItem = Pick<
  Invoice,
  | "id"
  | "workspaceId"
  | "customerId"
  | "invoiceNumber"
  | "status"
  | "issueDate"
  | "dueDate"
  | "currency"
> & {
  customerName: string;
  totalLabel: string;
};

const invoiceSampleData: InvoiceListItem[] = [
  {
    id: "invoice-0184",
    workspaceId: "workspace-acme-studio",
    customerId: "customer-brightline",
    invoiceNumber: "INV-2026-0184",
    customerName: "Brightline Studio",
    status: "draft",
    issueDate: "2026-09-21",
    dueDate: "2026-10-05",
    currency: "USD",
    totalLabel: "$1,560.00",
  },
  {
    id: "invoice-0183",
    workspaceId: "workspace-acme-studio",
    customerId: "customer-greenfield",
    invoiceNumber: "INV-2026-0183",
    customerName: "Greenfield Legal",
    status: "sent",
    issueDate: "2026-09-19",
    dueDate: "2026-10-03",
    currency: "USD",
    totalLabel: "$2,350.00",
  },
  {
    id: "invoice-0182",
    workspaceId: "workspace-acme-studio",
    customerId: "customer-acme",
    invoiceNumber: "INV-2026-0182",
    customerName: "Acme Ltd.",
    status: "sent",
    issueDate: "2026-09-15",
    dueDate: "2026-09-22",
    currency: "USD",
    totalLabel: "$1,250.00",
  },
  {
    id: "invoice-0181",
    workspaceId: "workspace-acme-studio",
    customerId: "customer-northstar",
    invoiceNumber: "INV-2026-0181",
    customerName: "Northstar Creative",
    status: "overdue",
    issueDate: "2026-08-19",
    dueDate: "2026-09-18",
    currency: "USD",
    totalLabel: "$5,990.00",
  },
  {
    id: "invoice-0180",
    workspaceId: "workspace-acme-studio",
    customerId: "customer-pine",
    invoiceNumber: "INV-2026-0180",
    customerName: "Pine & Co.",
    status: "paid",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    currency: "USD",
    totalLabel: "$980.00",
  },
  {
    id: "invoice-0178",
    workspaceId: "workspace-acme-studio",
    customerId: "customer-cascade",
    invoiceNumber: "INV-2026-0178",
    customerName: "Cascade Health",
    status: "cancelled",
    issueDate: "2026-08-14",
    dueDate: "2026-08-28",
    currency: "USD",
    totalLabel: "$750.00",
  },
];

export { invoiceSampleData, type InvoiceListItem, type InvoiceStatus };
