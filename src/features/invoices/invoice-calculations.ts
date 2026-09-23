import type { InvoiceLineItem, InvoiceTotals } from "@/features/invoices/invoice-types";
import {
  addMoney,
  assertSameCurrency,
  createMoney,
  subtractMoney,
  toSafeInteger,
  type CurrencyCode,
  type Money,
} from "@/features/invoices/money";

type CalculatedLineItemTotals = Pick<
  InvoiceTotals,
  "subtotal" | "discountTotal" | "taxTotal" | "total"
>;

type CalculatedInvoiceTotals = CalculatedLineItemTotals;

const basisPointsPerWhole = 10_000n;
const decimalQuantityPattern = /^(\d+)(?:\.(\d+))?$/;
const maximumQuantityDecimalPlaces = 6;

function assertNonNegativeMoney(money: Money, label: string) {
  createMoney(money.amountMinorUnits, money.currency);

  if (money.amountMinorUnits < 0) {
    throw new RangeError(`${label} cannot be negative.`);
  }
}

function assertNonNegativeBasisPoints(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer.`);
  }
}

function parseDecimalQuantity(quantity: string) {
  const match = decimalQuantityPattern.exec(quantity);

  if (!match) {
    throw new TypeError("Quantity must be a positive decimal string.");
  }

  const wholePart = match[1];
  const fractionalPart = match[2] ?? "";

  if (fractionalPart.length > maximumQuantityDecimalPlaces) {
    throw new RangeError(
      `Quantity cannot have more than ${maximumQuantityDecimalPlaces} decimal places.`,
    );
  }

  const denominator = 10n ** BigInt(fractionalPart.length);
  const numerator = BigInt(`${wholePart}${fractionalPart}`);

  if (numerator <= 0n) {
    throw new RangeError("Quantity must be greater than zero.");
  }

  return { denominator, numerator };
}

function divideAndRoundHalfUp(numerator: bigint, denominator: bigint) {
  if (numerator < 0n || denominator <= 0n) {
    throw new RangeError("Only non-negative values can use invoice rounding.");
  }

  return (numerator + denominator / 2n) / denominator;
}

function calculatePercentageAmount(amountMinorUnits: number, basisPoints: number) {
  return toSafeInteger(
    divideAndRoundHalfUp(BigInt(amountMinorUnits) * BigInt(basisPoints), basisPointsPerWhole),
  );
}

function calculateLineItemSubtotal(lineItem: InvoiceLineItem): Money {
  assertNonNegativeMoney(lineItem.unitPrice, "Unit price");

  const { denominator, numerator } = parseDecimalQuantity(lineItem.quantity);
  const subtotal = divideAndRoundHalfUp(
    BigInt(lineItem.unitPrice.amountMinorUnits) * numerator,
    denominator,
  );

  return createMoney(toSafeInteger(subtotal), lineItem.unitPrice.currency);
}

function calculateLineItemDiscount(lineItem: InvoiceLineItem): Money {
  const subtotal = calculateLineItemSubtotal(lineItem);
  const discount = lineItem.discount;

  if (!discount) {
    return createMoney(0, subtotal.currency);
  }

  if (discount.kind === "amount") {
    assertSameCurrency(subtotal, discount.amount);
    assertNonNegativeMoney(discount.amount, "Discount amount");

    if (discount.amount.amountMinorUnits > subtotal.amountMinorUnits) {
      throw new RangeError("Discount amount cannot exceed the line subtotal.");
    }

    return createMoney(discount.amount.amountMinorUnits, subtotal.currency);
  }

  if (discount.kind === "percentage") {
    assertNonNegativeBasisPoints(discount.basisPoints, "Discount basis points");

    if (discount.basisPoints > Number(basisPointsPerWhole)) {
      throw new RangeError("Discount basis points cannot exceed 100%.");
    }

    return createMoney(
      calculatePercentageAmount(subtotal.amountMinorUnits, discount.basisPoints),
      subtotal.currency,
    );
  }

  throw new TypeError("Unsupported discount kind.");
}

function calculateLineItemTax(lineItem: InvoiceLineItem): Money {
  assertNonNegativeBasisPoints(lineItem.taxRateBasisPoints, "Tax basis points");

  const subtotal = calculateLineItemSubtotal(lineItem);
  const discount = calculateLineItemDiscount(lineItem);
  const taxableAmount = subtractMoney(subtotal, discount);

  return createMoney(
    calculatePercentageAmount(taxableAmount.amountMinorUnits, lineItem.taxRateBasisPoints),
    subtotal.currency,
  );
}

function calculateLineItemTotals(lineItem: InvoiceLineItem): CalculatedLineItemTotals {
  const subtotal = calculateLineItemSubtotal(lineItem);
  const discountTotal = calculateLineItemDiscount(lineItem);
  const taxTotal = calculateLineItemTax(lineItem);
  const total = addMoney(subtractMoney(subtotal, discountTotal), taxTotal);

  return { discountTotal, subtotal, taxTotal, total };
}

function calculateInvoiceTotals(
  lineItems: readonly InvoiceLineItem[],
  currency: CurrencyCode,
): CalculatedInvoiceTotals {
  const zero = createMoney(0, currency);

  return lineItems.reduce<CalculatedInvoiceTotals>(
    (totals, lineItem) => {
      assertSameCurrency(totals.subtotal, lineItem.unitPrice);

      const lineTotals = calculateLineItemTotals(lineItem);

      return {
        discountTotal: addMoney(totals.discountTotal, lineTotals.discountTotal),
        subtotal: addMoney(totals.subtotal, lineTotals.subtotal),
        taxTotal: addMoney(totals.taxTotal, lineTotals.taxTotal),
        total: addMoney(totals.total, lineTotals.total),
      };
    },
    { discountTotal: zero, subtotal: zero, taxTotal: zero, total: zero },
  );
}

export {
  calculateInvoiceTotals,
  calculateLineItemDiscount,
  calculateLineItemSubtotal,
  calculateLineItemTax,
  calculateLineItemTotals,
  type CalculatedInvoiceTotals,
  type CalculatedLineItemTotals,
};
