const USD_FRACTION_DIGITS = 2;
const INTEGER_PATTERN = /^(?:0|-?[1-9]\d*)$/u;

/**
 * Formats a signed USD amount received from the API without converting its
 * integer minor units to JavaScript's floating-point Number type.
 */
function formatUsdMinorUnits(amountMinorUnits: string, locale = "en-US"): string {
  if (!INTEGER_PATTERN.test(amountMinorUnits)) {
    throw new TypeError("amountMinorUnits must be an integer string.");
  }

  const amount = BigInt(amountMinorUnits);
  const divisor = 10n ** BigInt(USD_FRACTION_DIGITS);
  const absoluteAmount = amount < 0n ? -amount : amount;
  const wholeUnits = absoluteAmount / divisor;
  const fractionalUnits = (absoluteAmount % divisor).toString().padStart(USD_FRACTION_DIGITS, "0");
  const formattedWholeUnits = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(wholeUnits);

  return `${amount < 0n ? "-" : ""}$${formattedWholeUnits}.${fractionalUnits}`;
}

export { formatUsdMinorUnits };
