const USD_FRACTION_DIGITS = 2;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

/**
 * Formats a positive USD amount received from the API without converting its
 * integer minor units to JavaScript's floating-point Number type.
 */
function formatUsdMinorUnits(amountMinorUnits: string, locale = "en-US"): string {
  if (!POSITIVE_INTEGER_PATTERN.test(amountMinorUnits)) {
    throw new TypeError("amountMinorUnits must be a positive integer string.");
  }

  const amount = BigInt(amountMinorUnits);
  const divisor = 10n ** BigInt(USD_FRACTION_DIGITS);
  const wholeUnits = amount / divisor;
  const fractionalUnits = (amount % divisor).toString().padStart(USD_FRACTION_DIGITS, "0");
  const formattedWholeUnits = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(wholeUnits);

  return `$${formattedWholeUnits}.${fractionalUnits}`;
}

export { formatUsdMinorUnits };
