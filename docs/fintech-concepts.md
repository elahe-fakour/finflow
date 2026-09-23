# FinTech Concepts

This document records financial concepts and rules that need to remain clear as
FinFlow grows. It complements the architectural boundaries in
[architecture.md](./architecture.md).

## Money and Financial Precision

### Scope

This is the contract for FinFlow's money utility and invoice calculation module.
The utility lives in `src/features/invoices/money.ts`, while pure invoice
calculations live in `src/features/invoices/invoice-calculations.ts`.

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

The utility enforces these rules today; the backend must enforce the same rules
when it is introduced:

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

The money utility provides small, pure helpers with these responsibilities:

| Helper               | Responsibility                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| `createMoney`        | Validate an integer minor-unit amount and pair it with a currency.       |
| `assertSameCurrency` | Reject an operation involving different currencies.                      |
| `parseMoneyInput`    | Convert a validated decimal input into configured currency minor units.  |
| `formatMoney`        | Format a validated `Money` value only at the UI display boundary.        |
| `addMoney`           | Return a new exact minor-unit sum for one currency.                      |
| `subtractMoney`      | Return a new exact minor-unit difference for one currency.               |
| `toSafeInteger`      | Reject a `BigInt` result that cannot safely become a JavaScript integer. |

`parseMoneyInput` and `formatMoney` stay outside the financial calculation
module. The former is a validation boundary between browser text and `Money`;
the latter is a one-way presentation boundary.

### Invoice Calculation Rules

`invoice-calculations.ts` is pure: it accepts invoice line-item data and returns
new `Money` values without changing its inputs or touching React, browser state,
or persistence.

For each line item, FinFlow uses this order:

1. Calculate `subtotal` from `unitPrice × quantity`.
2. Calculate the discount from that rounded subtotal.
3. Calculate tax from `subtotal - discount`.
4. Calculate `total` as `subtotal - discount + tax`.

Quantities are positive decimal strings with at most six fractional decimal
places. Intermediate calculations use `BigInt`, not decimal JavaScript numbers.
When a calculation results in a fraction of a minor unit, it rounds **half up**
to the nearest minor unit. For example, `0.5` cents becomes `1` cent.
FinFlow's TypeScript target is ES2020 so the runtime contract can rely on the
standard `BigInt` feature.

Percentage discounts and tax rates use basis points: `1%` is `100` basis points
and `100%` is `10,000` basis points. A percentage discount cannot exceed 100%.
Tax may be any non-negative safe-integer basis-point value because tax policy is
not yet jurisdiction-specific.

Each line is rounded before invoice totals are calculated. Invoice totals are
the exact sum of the rounded line subtotals, discounts, taxes, and totals. This
line-level approach keeps the resulting invoice traceable.

### Invoice Balances and Statuses

`invoice-status.ts` derives an invoice's `paid`, `outstanding`, and financial
status from the invoice total, recorded payment amounts, its due date, and an
explicit as-of date. It does not persist anything or use the current system
clock, which keeps a report for a particular date reproducible.

- `paid` is the exact sum of non-negative payment amounts in the invoice
  currency.
- `outstanding` is `invoice total - paid`. Payments that exceed the invoice
  total are rejected instead of being silently capped.
- `draft` and `cancelled` are explicit workflow states and remain unchanged.
- For a non-terminal invoice, an outstanding amount of zero derives `paid`.
  This includes a valid zero-total invoice.
- With a positive outstanding amount, an as-of date strictly after the due date
  derives `overdue`; the due date itself remains `sent`.

The payment-recording API will later enforce allowed workflow transitions and
run payment creation, balance updates, status derivation, and audit recording
inside one database transaction.

### Parsing, Rounding, and Formatting Boundaries

- `parseMoneyInput` converts a user-entered USD value such as `"12.50"` into
  minor units with `BigInt`, not `parseFloat`. It accepts only a non-negative
  decimal value without separators and at most two fractional digits. For
  example, enter `"1250.00"`, not `"1,250.00"`.
- Rounding rules for fractional quantities, percentage discounts, and tax are
  defined above and protected by focused unit tests before editable line items
  exist.
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
