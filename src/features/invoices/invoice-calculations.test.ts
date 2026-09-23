import {
  calculateInvoiceTotals,
  calculateLineItemDiscount,
  calculateLineItemSubtotal,
  calculateLineItemTax,
  calculateLineItemTotals,
} from "./invoice-calculations";
import type { InvoiceLineItem } from "./invoice-types";
import { createMoney } from "./money";
import { describe, expect, it } from "vitest";

function createLineItem(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    id: "line-1",
    description: "Financial operations review",
    quantity: "2",
    unitPrice: createMoney(1250, "USD"),
    taxRateBasisPoints: 0,
    ...overrides,
  };
}

describe("invoice calculations", () => {
  it("calculates an exact minor-unit subtotal", () => {
    const lineItem = createLineItem({ quantity: "3", unitPrice: createMoney(1250, "USD") });

    expect(calculateLineItemSubtotal(lineItem)).toEqual(createMoney(3750, "USD"));
  });

  it("rounds a fractional minor-unit subtotal half up", () => {
    const lineItem = createLineItem({ quantity: "0.5", unitPrice: createMoney(1, "USD") });

    expect(calculateLineItemSubtotal(lineItem)).toEqual(createMoney(1, "USD"));
  });

  it("calculates a percentage discount before tax", () => {
    const lineItem = createLineItem({
      quantity: "3",
      unitPrice: createMoney(1000, "USD"),
      discount: { basisPoints: 1000, kind: "percentage" },
      taxRateBasisPoints: 500,
    });

    expect(calculateLineItemDiscount(lineItem)).toEqual(createMoney(300, "USD"));
    expect(calculateLineItemTax(lineItem)).toEqual(createMoney(135, "USD"));
    expect(calculateLineItemTotals(lineItem)).toEqual({
      discountTotal: createMoney(300, "USD"),
      subtotal: createMoney(3000, "USD"),
      taxTotal: createMoney(135, "USD"),
      total: createMoney(2835, "USD"),
    });
  });

  it("calculates a fixed-amount discount", () => {
    const lineItem = createLineItem({
      discount: { amount: createMoney(250, "USD"), kind: "amount" },
    });

    expect(calculateLineItemTotals(lineItem)).toEqual({
      discountTotal: createMoney(250, "USD"),
      subtotal: createMoney(2500, "USD"),
      taxTotal: createMoney(0, "USD"),
      total: createMoney(2250, "USD"),
    });
  });

  it("sums rounded line results instead of rounding an invoice aggregate", () => {
    const halfCentLine = createLineItem({ quantity: "0.5", unitPrice: createMoney(1, "USD") });

    expect(
      calculateInvoiceTotals([halfCentLine, { ...halfCentLine, id: "line-2" }], "USD"),
    ).toEqual({
      discountTotal: createMoney(0, "USD"),
      subtotal: createMoney(2, "USD"),
      taxTotal: createMoney(0, "USD"),
      total: createMoney(2, "USD"),
    });
  });

  it("returns zero totals for an empty invoice in its requested currency", () => {
    expect(calculateInvoiceTotals([], "USD")).toEqual({
      discountTotal: createMoney(0, "USD"),
      subtotal: createMoney(0, "USD"),
      taxTotal: createMoney(0, "USD"),
      total: createMoney(0, "USD"),
    });
  });

  it("rejects invalid discounts, mismatched currencies, and over-precise quantities", () => {
    expect(() =>
      calculateLineItemDiscount(
        createLineItem({ discount: { basisPoints: 10001, kind: "percentage" } }),
      ),
    ).toThrow("cannot exceed 100%");
    expect(() =>
      calculateLineItemDiscount(
        createLineItem({ discount: { amount: createMoney(1, "EUR"), kind: "amount" } }),
      ),
    ).toThrow("same currency");
    expect(() => calculateLineItemSubtotal(createLineItem({ quantity: "1.0000001" }))).toThrow(
      "cannot have more than 6 decimal places",
    );
  });
});
