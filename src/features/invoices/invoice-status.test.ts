import {
  calculateInvoiceBalance,
  deriveInvoiceFinancialState,
  deriveInvoiceStatus,
  type InvoiceFinancialStateInput,
} from "./invoice-status";
import { createMoney } from "./money";
import { describe, expect, it } from "vitest";

function createPayment(amountMinorUnits: number, currency = "USD") {
  return { amount: createMoney(amountMinorUnits, currency) };
}

function createFinancialStateInput(
  overrides: Partial<InvoiceFinancialStateInput> = {},
): InvoiceFinancialStateInput {
  return {
    asOfDate: "2026-09-10",
    currentStatus: "sent",
    dueDate: "2026-09-10",
    invoiceTotal: createMoney(10_000, "USD"),
    payments: [],
    ...overrides,
  };
}

describe("invoice balances and statuses", () => {
  it("sums partial payments exactly and leaves the remaining balance outstanding", () => {
    expect(
      calculateInvoiceBalance(createMoney(10_000, "USD"), [
        createPayment(2_500),
        createPayment(1_500),
      ]),
    ).toEqual({
      outstanding: createMoney(6_000, "USD"),
      paid: createMoney(4_000, "USD"),
    });
  });

  it("keeps a partially paid invoice sent through its due date and marks it overdue afterwards", () => {
    const payment = createPayment(4_000);

    expect(
      deriveInvoiceFinancialState(createFinancialStateInput({ payments: [payment] })),
    ).toMatchObject({ status: "sent" });
    expect(
      deriveInvoiceFinancialState(
        createFinancialStateInput({ asOfDate: "2026-09-11", payments: [payment] }),
      ),
    ).toMatchObject({ status: "overdue" });
  });

  it("marks a fully paid invoice as paid even after its due date", () => {
    expect(
      deriveInvoiceFinancialState(
        createFinancialStateInput({
          asOfDate: "2026-09-11",
          payments: [createPayment(10_000)],
        }),
      ),
    ).toEqual({
      outstanding: createMoney(0, "USD"),
      paid: createMoney(10_000, "USD"),
      status: "paid",
    });
  });

  it("preserves draft and cancelled workflow states", () => {
    expect(
      deriveInvoiceStatus({
        asOfDate: "2026-09-11",
        currentStatus: "draft",
        dueDate: "2026-09-10",
        invoiceTotal: createMoney(10_000, "USD"),
        paid: createMoney(10_000, "USD"),
      }),
    ).toBe("draft");
    expect(
      deriveInvoiceStatus({
        asOfDate: "2026-09-11",
        currentStatus: "cancelled",
        dueDate: "2026-09-10",
        invoiceTotal: createMoney(10_000, "USD"),
        paid: createMoney(0, "USD"),
      }),
    ).toBe("cancelled");
  });

  it("marks a zero-total sent invoice as paid", () => {
    expect(
      deriveInvoiceFinancialState(
        createFinancialStateInput({ invoiceTotal: createMoney(0, "USD") }),
      ),
    ).toMatchObject({
      outstanding: createMoney(0, "USD"),
      paid: createMoney(0, "USD"),
      status: "paid",
    });
  });

  it("rejects overpayments, mismatched currencies, negative payments, and invalid dates", () => {
    expect(() =>
      calculateInvoiceBalance(createMoney(10_000, "USD"), [createPayment(10_001)]),
    ).toThrow("cannot exceed the invoice total");
    expect(() =>
      calculateInvoiceBalance(createMoney(10_000, "USD"), [createPayment(1, "EUR")]),
    ).toThrow("same currency");
    expect(() => calculateInvoiceBalance(createMoney(10_000, "USD"), [createPayment(-1)])).toThrow(
      "Payment amount cannot be negative",
    );
    expect(() =>
      deriveInvoiceFinancialState(createFinancialStateInput({ dueDate: "2026-02-30" })),
    ).toThrow("valid calendar date");
  });
});
