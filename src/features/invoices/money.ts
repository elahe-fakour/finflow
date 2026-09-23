/**
 * ISO 4217 currency code. Runtime validation of supported codes is introduced
 * with API validation; this frontend contract keeps the value explicit today.
 */
type CurrencyCode = string;

/**
 * A monetary amount represented as an integer in the currency's minor units.
 * For example, USD $12.50 is { amountMinorUnits: 1250, currency: "USD" }.
 *
 * The future money utility validates that amountMinorUnits is a safe integer
 * and that arithmetic only combines matching currencies.
 */
type Money = {
  amountMinorUnits: number;
  currency: CurrencyCode;
};

export { type CurrencyCode, type Money };
