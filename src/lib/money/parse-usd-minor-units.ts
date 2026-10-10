const USD_FRACTION_DIGITS = 2;
const MAX_POSTGRES_BIGINT = 9_223_372_036_854_775_807n;
const MONEY_INPUT_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/u;

/**
 * Converts a positive, user-entered USD decimal amount into the integer minor
 * unit string expected by the financial API. It intentionally uses BigInt so
 * a valid API amount is never rounded by a JavaScript floating-point Number.
 */
function parseUsdToMinorUnits(value: string): string {
  const normalizedValue = value.trim();
  const match = MONEY_INPUT_PATTERN.exec(normalizedValue);

  if (match === null) {
    throw new TypeError("Enter a positive USD amount with no separators, for example 1250.00.");
  }

  const wholeUnits = match[1];
  const fractionalUnits = (match[2] ?? "").padEnd(USD_FRACTION_DIGITS, "0");
  const minorUnits = BigInt(wholeUnits) * 100n + BigInt(fractionalUnits || "0");

  if (minorUnits <= 0n) {
    throw new RangeError("Amount must be greater than zero.");
  }

  if (minorUnits > MAX_POSTGRES_BIGINT) {
    throw new RangeError("Amount exceeds the supported range.");
  }

  return minorUnits.toString();
}

export { parseUsdToMinorUnits };
