import type { CurrencyCode, Money } from "@/features/invoices/money";

/** A calendar date in YYYY-MM-DD format. */
type DateOnlyString = string;

/** An ISO 8601 date-time string. */
type IsoDateTimeString = string;

/**
 * A decimal quantity stored as text, such as "1", "2.5", or "0.25".
 * This avoids using JavaScript floating-point numbers in invoice calculations.
 */
type DecimalQuantity = string;

const invoiceStatuses = ["draft", "sent", "paid", "overdue", "cancelled"] as const;

type InvoiceStatus = (typeof invoiceStatuses)[number];

type LineItemDiscount =
  | {
      kind: "amount";
      amount: Money;
    }
  | {
      kind: "percentage";
      basisPoints: number;
    };

type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: DecimalQuantity;
  unitPrice: Money;
  taxRateBasisPoints: number;
  discount?: LineItemDiscount;
};

type InvoiceTotals = {
  subtotal: Money;
  discountTotal: Money;
  taxTotal: Money;
  total: Money;
  paid: Money;
  outstanding: Money;
};

type Invoice = {
  id: string;
  workspaceId: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: DateOnlyString;
  dueDate: DateOnlyString;
  currency: CurrencyCode;
  lineItems: InvoiceLineItem[];
  notes?: string;
  totals: InvoiceTotals;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
};

const paymentMethods = ["bank-transfer", "cash", "card", "other"] as const;

type PaymentMethod = (typeof paymentMethods)[number];

type Payment = {
  id: string;
  workspaceId: string;
  invoiceId: string;
  amount: Money;
  receivedAt: IsoDateTimeString;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: IsoDateTimeString;
};

export {
  invoiceStatuses,
  paymentMethods,
  type DateOnlyString,
  type DecimalQuantity,
  type Invoice,
  type InvoiceLineItem,
  type InvoiceStatus,
  type InvoiceTotals,
  type IsoDateTimeString,
  type LineItemDiscount,
  type Payment,
  type PaymentMethod,
};
