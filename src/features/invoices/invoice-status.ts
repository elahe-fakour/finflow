import type {
  DateOnlyString,
  InvoiceStatus,
  InvoiceTotals,
  Payment,
} from "@/features/invoices/invoice-types";
import {
  addMoney,
  assertSameCurrency,
  createMoney,
  subtractMoney,
  type Money,
} from "@/features/invoices/money";

type InvoiceBalance = Pick<InvoiceTotals, "outstanding" | "paid">;

type InvoiceStatusDerivationInput = {
  asOfDate: DateOnlyString;
  currentStatus: InvoiceStatus;
  dueDate: DateOnlyString;
  invoiceTotal: Money;
  paid: Money;
};

type InvoiceFinancialState = InvoiceBalance & {
  status: InvoiceStatus;
};

type InvoiceFinancialStateInput = Omit<InvoiceStatusDerivationInput, "paid"> & {
  payments: readonly Pick<Payment, "amount">[];
};

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function assertNonNegativeMoney(money: Money, label: string) {
  createMoney(money.amountMinorUnits, money.currency);

  if (money.amountMinorUnits < 0) {
    throw new RangeError(`${label} cannot be negative.`);
  }
}

function assertDateOnly(value: DateOnlyString, label: string) {
  const match = dateOnlyPattern.exec(value);

  if (!match) {
    throw new TypeError(`${label} must use YYYY-MM-DD format.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`${label} must be a valid calendar date.`);
  }
}

function calculateInvoiceBalance(
  invoiceTotal: Money,
  payments: readonly Pick<Payment, "amount">[],
): InvoiceBalance {
  assertNonNegativeMoney(invoiceTotal, "Invoice total");

  const paid = payments.reduce<Money>(
    (totalPaid, payment) => {
      assertSameCurrency(invoiceTotal, payment.amount);
      assertNonNegativeMoney(payment.amount, "Payment amount");

      return addMoney(totalPaid, payment.amount);
    },
    createMoney(0, invoiceTotal.currency),
  );

  if (paid.amountMinorUnits > invoiceTotal.amountMinorUnits) {
    throw new RangeError("Payments cannot exceed the invoice total.");
  }

  return {
    outstanding: subtractMoney(invoiceTotal, paid),
    paid,
  };
}

function deriveInvoiceStatus({
  asOfDate,
  currentStatus,
  dueDate,
  invoiceTotal,
  paid,
}: InvoiceStatusDerivationInput): InvoiceStatus {
  assertDateOnly(asOfDate, "As-of date");
  assertDateOnly(dueDate, "Due date");
  assertSameCurrency(invoiceTotal, paid);
  assertNonNegativeMoney(invoiceTotal, "Invoice total");
  assertNonNegativeMoney(paid, "Paid amount");

  if (paid.amountMinorUnits > invoiceTotal.amountMinorUnits) {
    throw new RangeError("Paid amount cannot exceed the invoice total.");
  }

  if (currentStatus === "draft" || currentStatus === "cancelled") {
    return currentStatus;
  }

  if (paid.amountMinorUnits === invoiceTotal.amountMinorUnits) {
    return "paid";
  }

  return asOfDate > dueDate ? "overdue" : "sent";
}

function deriveInvoiceFinancialState({
  asOfDate,
  currentStatus,
  dueDate,
  invoiceTotal,
  payments,
}: InvoiceFinancialStateInput): InvoiceFinancialState {
  const balance = calculateInvoiceBalance(invoiceTotal, payments);

  return {
    ...balance,
    status: deriveInvoiceStatus({
      asOfDate,
      currentStatus,
      dueDate,
      invoiceTotal,
      paid: balance.paid,
    }),
  };
}

export {
  calculateInvoiceBalance,
  deriveInvoiceFinancialState,
  deriveInvoiceStatus,
  type InvoiceBalance,
  type InvoiceFinancialState,
  type InvoiceFinancialStateInput,
  type InvoiceStatusDerivationInput,
};
