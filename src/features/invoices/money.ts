/**
 * ISO 4217 currency code. Runtime validation of supported codes is introduced
 * with API validation; this frontend contract keeps the value explicit today.
 */
type CurrencyCode = string;

/**
 * A monetary amount represented as an integer in the currency's minor units.
 * For example, USD $12.50 is { amountMinorUnits: 1250, currency: "USD" }.
 *
 * This module validates that amountMinorUnits is a safe integer and that
 * arithmetic only combines matching currencies.
 */
type Money = {
  amountMinorUnits: number;
  currency: CurrencyCode;
};

const currencyCodePattern = /^[A-Z]{3}$/;
const currencyFractionDigits: Record<string, number> = {
  USD: 2,
};
const moneyInputPattern = /^(\d+)(?:\.(\d+))?$/;
const maximumSafeInteger = BigInt(Number.MAX_SAFE_INTEGER);
const minimumSafeInteger = BigInt(Number.MIN_SAFE_INTEGER);

function assertCurrencyCode(currency: CurrencyCode) {
  if (typeof currency !== "string" || !currencyCodePattern.test(currency)) {
    throw new TypeError("Currency must be a normalized three-letter ISO 4217 code.");
  }
}

function assertMinorUnitAmount(amountMinorUnits: number) {
  if (!Number.isSafeInteger(amountMinorUnits)) {
    throw new RangeError("Monetary minor units must be a safe integer.");
  }
}

function createMoney(amountMinorUnits: number, currency: CurrencyCode): Money {
  assertMinorUnitAmount(amountMinorUnits);
  assertCurrencyCode(currency);

  return { amountMinorUnits, currency };
}

function assertMoney(money: Money) {
  assertMinorUnitAmount(money.amountMinorUnits);
  assertCurrencyCode(money.currency);
}

function assertSameCurrency(left: Money, right: Money) {
  assertMoney(left);
  assertMoney(right);

  if (left.currency !== right.currency) {
    throw new TypeError("Money values must use the same currency.");
  }
}

function toSafeInteger(value: bigint) {
  if (value > maximumSafeInteger || value < minimumSafeInteger) {
    throw new RangeError("Monetary operation exceeds JavaScript's safe-integer range.");
  }

  return Number(value);
}

function getCurrencyFractionDigits(currency: CurrencyCode) {
  assertCurrencyCode(currency);

  const fractionDigits = currencyFractionDigits[currency];

  if (fractionDigits === undefined) {
    throw new RangeError(`Currency ${currency} does not have a configured minor-unit definition.`);
  }

  return fractionDigits;
}

function parseMoneyInput(value: string, currency: CurrencyCode): Money {
  const normalizedValue = value.trim();
  const match = moneyInputPattern.exec(normalizedValue);
  const fractionDigits = getCurrencyFractionDigits(currency);

  if (!match) {
    throw new TypeError("Money input must be a non-negative decimal value without separators.");
  }

  const wholePart = match[1];
  const fractionalPart = match[2] ?? "";

  if (fractionalPart.length > fractionDigits) {
    throw new RangeError(`Money input cannot have more than ${fractionDigits} decimal places.`);
  }

  const minorUnitFactor = 10n ** BigInt(fractionDigits);
  const minorUnits =
    BigInt(wholePart) * minorUnitFactor + BigInt(fractionalPart.padEnd(fractionDigits, "0") || "0");

  return createMoney(toSafeInteger(minorUnits), currency);
}

function formatMoney(money: Money, locale = "en-US") {
  assertMoney(money);

  const fractionDigits = getCurrencyFractionDigits(money.currency);
  const majorUnitValue = money.amountMinorUnits / 10 ** fractionDigits;

  return new Intl.NumberFormat(locale, {
    currency: money.currency,
    style: "currency",
  }).format(majorUnitValue);
}

function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);

  return createMoney(
    toSafeInteger(BigInt(left.amountMinorUnits) + BigInt(right.amountMinorUnits)),
    left.currency,
  );
}

function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);

  return createMoney(
    toSafeInteger(BigInt(left.amountMinorUnits) - BigInt(right.amountMinorUnits)),
    left.currency,
  );
}

export {
  addMoney,
  assertSameCurrency,
  createMoney,
  formatMoney,
  parseMoneyInput,
  subtractMoney,
  toSafeInteger,
  type CurrencyCode,
  type Money,
};
