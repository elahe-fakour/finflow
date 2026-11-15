# Financial Reporting Rules

## Status and Scope

This document defines the initial reporting contract for Phase 11. It is the
source of truth for report queries and UI labels until an approved change updates
it. Reports are read-only summaries; they do not create or modify financial
records.

The first implementation covers Profit & Loss, cash flow, bank-account balances,
accounts receivable, and category breakdowns. Accounts payable is deferred until
FinFlow has a bill and vendor-payment model; an unpaid expense entry alone is not
enough evidence to report a payable.

The first API endpoint is
`GET /api/v1/workspaces/:workspaceId/reports/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD`.
It requires workspace `VIEW` permission and returns the requested range, `USD`
currency, an `ACCRUAL` basis, invoice revenue, manual income, manual expenses,
total income, total expenses, and net profit as integer minor-unit strings.

Cash flow is queried separately at
`GET /api/v1/workspaces/:workspaceId/reports/cash-flow?from=YYYY-MM-DD&to=YYYY-MM-DD`.
It returns the inclusive date range, `USD` currency, a `CASH` basis, total inflows,
total outflows as positive magnitudes, net cash flow, and those same totals grouped
by calendar month. Each month is formatted as `YYYY-MM`. Empty periods return zero
totals and an empty monthly breakdown.

## Date Range and Currency

- Report periods use inclusive ISO calendar dates: `from <= date <= to`.
- The API requires an explicit `from` and `to` for range reports and rejects an
  invalid date or `from > to`. An as-of report uses one explicit `asOf` date.
- Database `DATE` fields are compared as calendar dates, without converting
  through local time. Payment timestamps are grouped by their UTC calendar date
  until workspaces have a configured time zone.
- The report UI may choose a convenient initial period, but it must send the
  resulting dates explicitly so the same request is reproducible.
- FinFlow currently supports USD reporting only. Query results retain currency
  and aggregate only within the same currency; they must never add amounts from
  different currencies or apply an implicit exchange rate.
- Monetary aggregates use PostgreSQL `BIGINT` / TypeScript `bigint` minor units.
  JSON represents these amounts as integer strings; formatting happens in the
  web application.

## Profit & Loss

The initial Profit & Loss report uses an accrual-style basis:

- **Invoice revenue** is recognized on `Invoice.issueDate` for invoices currently
  in `SENT`, `OVERDUE`, or `PAID` status. Draft and cancelled invoices are
  excluded.
- **Manual income** is recognized on `IncomeExpenseEntry.occurredOn` for entries
  whose type is `INCOME`.
- **Expenses** are recognized on `IncomeExpenseEntry.occurredOn` for entries
  whose type is `EXPENSE`.
- **Net profit** is reported income minus reported expenses, using exact minor
  unit arithmetic.
- Payments and bank transactions are not added to Profit & Loss totals. A
  payment settles an invoice receivable; a reconciled bank transaction is the
  cash evidence for that payment. Counting either again would double count
  invoice revenue.
- Manual income must represent income outside invoice revenue. The current data
  model cannot automatically detect a manual entry that duplicates an invoice;
  the UI and documentation must make this boundary clear.
- Invoice revenue has no category field in the current schema. Revenue can be
  shown by customer, while category breakdowns use categorized manual income
  entries only. The UI must not imply that invoice revenue is categorized.

The report is based on the invoice's current status because FinFlow does not yet
store invoice status history. If an invoice is later cancelled, a rerun of an
older period excludes it. Reports are therefore current-state summaries, not
immutable historical snapshots.

## Cash Flow

Cash flow is based only on signed `BankTransaction.amountMinorUnits`, grouped by
`transactionDate`:

- Positive amounts are inflows; negative amounts are outflows.
- Net cash flow is inflows plus signed outflows for the requested period.
- Payments, invoices, and manual income/expense entries are not added to cash
  flow; they may describe the same real-world movement as a bank transaction.
- The schema does not identify transfers between two FinFlow bank accounts as a
  linked pair. Until transfer records exist, reports cannot reliably eliminate
  both sides of an internal transfer. This limitation must be visible wherever
  users compare cash-flow totals with account balances.

## Bank-Account Balance as of a Date

For each account in the requested currency, calculate:

```text
opening balance + signed bank transactions effective on or before the as-of date
```

`openingBalanceDate` is the start-of-day date on which the opening balance takes
effect. Include transactions dated on or after that date and on or before the
as-of date. When the opening balance is zero and has no date, treat it as an
opening balance from the beginning of the account history. A non-zero opening
balance without an effective date is rejected by the API.

An account whose opening date is after the requested as-of date is not yet
included in that date's balance. Sum balances only for accounts with the same
currency.

## Accounts Receivable

Accounts receivable is an as-of calculation, not a sum of current invoice status
labels:

1. Consider invoices issued on or before the as-of date whose current status is
   `SENT`, `OVERDUE`, or `PAID`.
2. Sum payments received on or before the as-of date for each invoice.
3. Calculate outstanding as invoice total minus those payments. Reject an
   impossible negative balance rather than clamp it to zero.
4. Exclude draft and cancelled invoices. Since status history is not stored,
   later cancellation can change a historical rerun.
5. Classify a positive outstanding balance as overdue only when the due date is
   strictly before the as-of date; the due date itself is not overdue.

The report must use integer minor units and the invoice currency. Payment
timestamps use the UTC date rule above.

## Accounts Payable

Accounts payable is not included in the first report implementation. FinFlow has
manual expense entries but no vendor bills, due-date facts, or vendor-payment
allocations. Treating an expense as unpaid would invent a payable state the data
does not store. Add this report only after a bill/payment model and its lifecycle
rules are designed.

## Empty, Partial, and Error Results

- A valid period with no matching records returns zero totals and empty
  breakdowns; it is not an error.
- Missing required dates, invalid ranges, unsupported currencies, or unsafe
  aggregation results return a validation/domain error.
- Database failures return the standard API error response; the UI must show an
  error state rather than replacing a failed report with zero values.
- Responses include the report basis, requested dates, currency, and data
  availability so the UI can label the result accurately.

## Implementation Acceptance Criteria

1. Every query is scoped by the authorized workspace and includes its
   `workspaceId` predicate.
2. The API returns integer minor-unit strings and never converts aggregate money
   through JavaScript `number`.
3. Profit & Loss and cash flow use separate, documented sources so payments are
   not counted twice.
4. Date boundaries are inclusive, deterministic, and covered by API tests.
5. Accounts payable is not represented as zero or as a real report until bill
   records exist.
6. The report UI discloses the basis, date range, currency, and current-state
   limitation where relevant.
