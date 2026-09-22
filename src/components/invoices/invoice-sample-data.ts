import type { Invoice, InvoiceStatus, Payment } from "@/features/invoices/invoice-types";

type InvoiceTotalsDisplay = {
  subtotalLabel: string;
  discountTotalLabel: string;
  taxTotalLabel: string;
  totalLabel: string;
  paidLabel: string;
  outstandingLabel: string;
};

type PaymentHistoryItem = Pick<
  Payment,
  "id" | "workspaceId" | "invoiceId" | "amount" | "receivedAt" | "method" | "reference"
> & {
  receivedAtLabel: string;
  methodLabel: string;
  amountLabel: string;
};

type InvoiceDetailItem = Pick<
  Invoice,
  | "id"
  | "workspaceId"
  | "customerId"
  | "invoiceNumber"
  | "status"
  | "issueDate"
  | "dueDate"
  | "currency"
  | "totals"
> & {
  customerName: string;
  totalsDisplay: InvoiceTotalsDisplay;
  paymentHistory: PaymentHistoryItem[];
};

type InvoiceListItem = Pick<
  InvoiceDetailItem,
  | "id"
  | "workspaceId"
  | "customerId"
  | "invoiceNumber"
  | "status"
  | "issueDate"
  | "dueDate"
  | "currency"
  | "customerName"
> & {
  totalLabel: string;
};

/**
 * Presentation-only sample data. Labels are deliberately explicit until the
 * money formatting utility and calculation service are introduced.
 */
const invoiceDetailSampleData: InvoiceDetailItem[] = [
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
    totals: {
      subtotal: { amountMinorUnits: 156000, currency: "USD" },
      discountTotal: { amountMinorUnits: 0, currency: "USD" },
      taxTotal: { amountMinorUnits: 0, currency: "USD" },
      total: { amountMinorUnits: 156000, currency: "USD" },
      paid: { amountMinorUnits: 0, currency: "USD" },
      outstanding: { amountMinorUnits: 156000, currency: "USD" },
    },
    totalsDisplay: {
      subtotalLabel: "$1,560.00",
      discountTotalLabel: "$0.00",
      taxTotalLabel: "$0.00",
      totalLabel: "$1,560.00",
      paidLabel: "$0.00",
      outstandingLabel: "$1,560.00",
    },
    paymentHistory: [],
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
    totals: {
      subtotal: { amountMinorUnits: 235000, currency: "USD" },
      discountTotal: { amountMinorUnits: 0, currency: "USD" },
      taxTotal: { amountMinorUnits: 0, currency: "USD" },
      total: { amountMinorUnits: 235000, currency: "USD" },
      paid: { amountMinorUnits: 0, currency: "USD" },
      outstanding: { amountMinorUnits: 235000, currency: "USD" },
    },
    totalsDisplay: {
      subtotalLabel: "$2,350.00",
      discountTotalLabel: "$0.00",
      taxTotalLabel: "$0.00",
      totalLabel: "$2,350.00",
      paidLabel: "$0.00",
      outstandingLabel: "$2,350.00",
    },
    paymentHistory: [],
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
    totals: {
      subtotal: { amountMinorUnits: 125000, currency: "USD" },
      discountTotal: { amountMinorUnits: 0, currency: "USD" },
      taxTotal: { amountMinorUnits: 0, currency: "USD" },
      total: { amountMinorUnits: 125000, currency: "USD" },
      paid: { amountMinorUnits: 0, currency: "USD" },
      outstanding: { amountMinorUnits: 125000, currency: "USD" },
    },
    totalsDisplay: {
      subtotalLabel: "$1,250.00",
      discountTotalLabel: "$0.00",
      taxTotalLabel: "$0.00",
      totalLabel: "$1,250.00",
      paidLabel: "$0.00",
      outstandingLabel: "$1,250.00",
    },
    paymentHistory: [],
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
    totals: {
      subtotal: { amountMinorUnits: 599000, currency: "USD" },
      discountTotal: { amountMinorUnits: 0, currency: "USD" },
      taxTotal: { amountMinorUnits: 0, currency: "USD" },
      total: { amountMinorUnits: 599000, currency: "USD" },
      paid: { amountMinorUnits: 0, currency: "USD" },
      outstanding: { amountMinorUnits: 599000, currency: "USD" },
    },
    totalsDisplay: {
      subtotalLabel: "$5,990.00",
      discountTotalLabel: "$0.00",
      taxTotalLabel: "$0.00",
      totalLabel: "$5,990.00",
      paidLabel: "$0.00",
      outstandingLabel: "$5,990.00",
    },
    paymentHistory: [],
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
    totals: {
      subtotal: { amountMinorUnits: 98000, currency: "USD" },
      discountTotal: { amountMinorUnits: 0, currency: "USD" },
      taxTotal: { amountMinorUnits: 0, currency: "USD" },
      total: { amountMinorUnits: 98000, currency: "USD" },
      paid: { amountMinorUnits: 98000, currency: "USD" },
      outstanding: { amountMinorUnits: 0, currency: "USD" },
    },
    totalsDisplay: {
      subtotalLabel: "$980.00",
      discountTotalLabel: "$0.00",
      taxTotalLabel: "$0.00",
      totalLabel: "$980.00",
      paidLabel: "$980.00",
      outstandingLabel: "$0.00",
    },
    paymentHistory: [
      {
        id: "payment-0091",
        workspaceId: "workspace-acme-studio",
        invoiceId: "invoice-0180",
        amount: { amountMinorUnits: 98000, currency: "USD" },
        receivedAt: "2026-09-14T14:32:00.000Z",
        method: "bank-transfer",
        reference: "TRX-2026-0091",
        receivedAtLabel: "Sep 14, 2026",
        methodLabel: "Bank transfer",
        amountLabel: "$980.00",
      },
    ],
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
    totals: {
      subtotal: { amountMinorUnits: 75000, currency: "USD" },
      discountTotal: { amountMinorUnits: 0, currency: "USD" },
      taxTotal: { amountMinorUnits: 0, currency: "USD" },
      total: { amountMinorUnits: 75000, currency: "USD" },
      paid: { amountMinorUnits: 0, currency: "USD" },
      outstanding: { amountMinorUnits: 0, currency: "USD" },
    },
    totalsDisplay: {
      subtotalLabel: "$750.00",
      discountTotalLabel: "$0.00",
      taxTotalLabel: "$0.00",
      totalLabel: "$750.00",
      paidLabel: "$0.00",
      outstandingLabel: "$0.00",
    },
    paymentHistory: [],
  },
];

const invoiceSampleData: InvoiceListItem[] = invoiceDetailSampleData.map((invoice) => ({
  id: invoice.id,
  workspaceId: invoice.workspaceId,
  customerId: invoice.customerId,
  invoiceNumber: invoice.invoiceNumber,
  customerName: invoice.customerName,
  status: invoice.status,
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  currency: invoice.currency,
  totalLabel: invoice.totalsDisplay.totalLabel,
}));

export {
  invoiceDetailSampleData,
  invoiceSampleData,
  type InvoiceDetailItem,
  type InvoiceListItem,
  type InvoiceStatus,
  type PaymentHistoryItem,
};
