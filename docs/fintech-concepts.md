# FinTech Concepts

This document records financial concepts and rules that need to remain clear as
FinFlow grows. It complements the architectural boundaries in
[architecture.md](./architecture.md).

## Money and Financial Precision

### Scope

This is the contract for FinFlow's future money utility. It defines the
representation and invariants before financial calculation functions are
implemented. The utility will live in `src/features/invoices/money.ts`; its
first executable arithmetic functions are intentionally deferred to the next
task.

### Representation

Every monetary value is represented as:

```ts
type Money = {
  amountMinorUnits: number;
  currency: CurrencyCode;
};
```

`amountMinorUnits` is an integer in the smallest configured unit of its
currency. For the initial USD-only workflow, `$12.50` is represented as:

```ts
{ amountMinorUnits: 1250, currency: "USD" }
```

FinFlow currently exposes USD only. Carrying a `currency` field now does not
mean that multi-currency conversion is supported; conversion and exchange-rate
management are explicitly outside the MVP.

### Why not use decimal JavaScript numbers?

JavaScript uses binary floating-point numbers. Many decimal fractions cannot be
represented exactly, so this expression is unreliable for financial logic:

```ts
0.1 + 0.2; // 0.30000000000000004
```

FinFlow must never use decimal JavaScript numbers for persisted monetary values
or financial arithmetic. Using integer minor units means addition and
subtraction remain exact while values stay within JavaScript's safe-integer
range.

### Invariants

The future utility and backend validation must enforce these rules:

- `amountMinorUnits` is a finite safe integer. It cannot be `NaN`, infinite,
  or fractional.
- `currency` is an explicit normalized ISO 4217 code. The API will validate
  which codes FinFlow supports.
- A zero amount is valid.
- A negative amount is allowed only in a domain operation that explicitly
  models a credit, reversal, or signed balance. Invoice line prices, invoice
  totals, and recorded payments must be non-negative.
- Arithmetic may combine values only when their currency codes match. A
  currency mismatch is a domain error, never an implicit conversion.
- Arithmetic must not mutate its input `Money` objects.
- If an operation would exceed JavaScript's safe-integer range, it must fail
  rather than silently losing precision.

### Utility Contract

The first implementation of the money utility will provide small, pure helpers
with these responsibilities:

| Helper               | Responsibility                                                                     |
| -------------------- | ---------------------------------------------------------------------------------- |
| `createMoney`        | Validate an integer minor-unit amount and pair it with a currency.                 |
| `assertSameCurrency` | Reject an operation involving different currencies.                                |
| `addMoney`           | Return a new exact minor-unit sum for one currency.                                |
| `subtractMoney`      | Return a new exact minor-unit difference for one currency.                         |
| `formatMoney`        | Produce display text only at the UI boundary; it performs no business calculation. |

The calculation module will build invoice subtotals, discounts, taxes, and
totals from these primitives. React components will display those results but
will not calculate them.

### Parsing, Rounding, and Formatting Boundaries

- Parsing a user-entered value such as `"12.50"` into minor units is an input
  validation concern. It must not use `parseFloat` as the source of truth.
- Rounding rules for fractional quantities, percentage discounts, and tax will
  be defined alongside the line-item calculation functions. They must be
  explicit and covered by unit tests before editable line items exist.
- `formatMoney` is presentation-only. A formatted value must never be parsed
  back into a financial value.
- `toFixed`, `Math.round`, and decimal JavaScript arithmetic must not be used
  as shortcuts for financial calculations.

### Examples

| Business value | Correct representation                          |
| -------------- | ----------------------------------------------- |
| USD $0.00      | `{ amountMinorUnits: 0, currency: "USD" }`      |
| USD $12.50     | `{ amountMinorUnits: 1250, currency: "USD" }`   |
| USD $1,250.00  | `{ amountMinorUnits: 125000, currency: "USD" }` |

### Backend Implications

When the API and database are introduced, the API will validate the same
invariants and PostgreSQL will persist minor-unit amounts as integer values with
the currency code beside them. Any workflow that records a payment and changes
an invoice balance will run in a database transaction and create an audit event.
