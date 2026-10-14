# Reconciliation Design

## Status

Design approved for Phase 10, Milestone 10.1, Task 1. This document defines
the financial invariants and state rules before FinFlow implements candidate
scoring, suggestions, confirmation endpoints, or reconciliation UI.

## Goal

Reconciliation explains why an incoming bank transaction represents a payment
against one invoice. It connects three financial facts:

```text
positive BankTransaction → Payment → Invoice
```

The bank transaction is evidence from the bank account. The payment is the
application's receivable fact. The invoice is the amount owed by the customer.
A suggestion is never financial evidence; only an explicit confirmation creates
a reconciliation record.

## MVP Scope

- Match one eligible incoming bank transaction to one invoice payment.
- Offer explainable, deterministic invoice candidates before confirmation.
- Let an authorized user confirm a suggested or manual match.
- Create the payment, update the invoice financial state, and confirm the
  reconciliation atomically in the later workflow task.
- Preserve a reconciliation record with its match type, confirmation time, and
  optional suggested confidence.

## Explicitly Out of Scope

- Splitting one bank transaction across several invoices.
- Combining several bank transactions into one payment.
- Matching outgoing transactions to vendor bills or expense entries.
- Automatic confirmation without a human action.
- Editing a bank transaction's source amount or date during reconciliation.
- Deleting a confirmed reconciliation.
- A reversal UI or cancellation endpoint. The reversal rules below are a
  contract for the later audited reversal task, not implemented behavior.
- Currency conversion, foreign-exchange matching, and tolerance-based amount
  matching.

## Financial Invariants

The later API must enforce these rules on the backend. The UI may explain or
hide ineligible actions, but it is not an authorization or integrity boundary.

1. **Workspace isolation:** the bank transaction, bank account, payment,
   invoice, customer, reconciliation record, and acting user membership must
   belong to the same workspace.
2. **Authorization:** viewing suggestions requires `VIEW`; confirming or
   reversing reconciliation requires `MANAGE_FINANCIAL_DATA`. This permits
   Owner, Admin, and Accountant roles, but not Member.
3. **Incoming money only:** the selected bank transaction must have a positive,
   non-zero signed minor-unit amount. Negative bank transactions are expenses
   and are outside this invoice-payment workflow.
4. **Currency equality:** the selected bank account currency and invoice
   currency must be identical. FinFlow must not infer or apply an exchange rate.
5. **Exact amount:** the payment amount created on confirmation must equal the
   bank transaction amount exactly in integer minor units. No floating-point
   calculations or "close enough" tolerance is allowed in the MVP.
6. **Invoice eligibility:** the invoice must be `SENT` or `OVERDUE`, and its
   derived outstanding balance must be strictly positive. `DRAFT`, `PAID`, and
   `CANCELLED` invoices cannot receive a reconciliation payment.
7. **No overpayment:** existing payments plus the new payment must not exceed
   the invoice total. The invoice's paid, outstanding, and status values are
   recalculated from payments; they are not independently trusted inputs.
8. **One active match per fact:** a bank transaction and payment may each have
   at most one `CONFIRMED` reconciliation. The database's partial unique
   indexes are the final concurrency protection.
9. **Source facts are immutable:** confirmation does not alter the source bank
   transaction amount, date, description, reference, import provenance, or
   external identifier.
10. **Traceability:** confirmation records the actor, match type, confidence
    when applicable, timestamps, and a user-entered note when supplied. The
    later Audit Log phase adds a durable audit event in the same transaction.

## State Model

Candidate suggestions are computed read models; they are not persisted and do
not change any financial state.

```text
Eligible bank transaction
        │
        ├─ deterministic candidate scoring ──> suggested candidate(s)
        │                                      (no write)
        │
        └─ user selects a suggested or manual invoice
                         │
                         ▼
                    CONFIRMED
       Payment created + invoice recalculated + reconciliation recorded
                         │
                         ▼
                    REVERSED
       Future audited reversal only; historical record remains visible
```

`Reconciliation.status` has two persisted states:

| State       | Meaning                                                                             | Allowed next state                                    |
| ----------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `CONFIRMED` | An active bank transaction-to-payment match. `reversedAt` is `null`.                | `REVERSED` only through the future reversal workflow. |
| `REVERSED`  | Historical evidence that an earlier confirmation was reversed. `reversedAt` is set. | No transition in the MVP.                             |

`Reconciliation.matchType` explains the decision source:

- `SUGGESTED`: the user confirmed a candidate produced by FinFlow. Store the
  candidate's deterministic confidence in integer basis points from `0` to
  `10,000` (`9,600` means 96%).
- `MANUAL`: the user deliberately chose an invoice without relying on a
  suggestion. `confidenceBasisPoints` must be `null`; a fabricated score would
  misrepresent the evidence.

## Deterministic Candidate Scoring

Candidate scoring is an explainable ranking aid, not an authorization decision
and not an automatic reconciliation rule. The service first applies the
financial eligibility rules. It then scores only invoices that are in the same
workspace and currency, are `SENT` or `OVERDUE`, have a positive outstanding
balance, and have an outstanding amount exactly equal to the positive bank
transaction amount.

An invoice that fails an eligibility rule is not given a low score; it is not a
candidate at all. This avoids implying that a cross-currency, paid, cancelled,
or overpaid invoice might be safe to confirm.

### Scoring Inputs

The initial scorer uses only fields already held by FinFlow. It does not call an
external service or infer facts from an opaque model.

| Evidence                 | Source fields                                                         | Maximum basis points | Deterministic rule                                                                                                 |
| ------------------------ | --------------------------------------------------------------------- | -------------------: | ------------------------------------------------------------------------------------------------------------------ |
| Exact outstanding amount | Bank transaction amount; invoice derived outstanding amount           |                6,000 | Exact equality of signed integer minor units after eligibility has established an incoming transaction.            |
| Invoice-number evidence  | Bank transaction `reference` and `description`; invoice number        |                2,500 | The normalized full invoice number appears as a whole token in either source field. It is awarded once, not twice. |
| Customer-name evidence   | Bank transaction `reference` and `description`; invoice customer name |                  800 | The normalized full customer name appears as a whole phrase in either source field. It is awarded once.            |
| Date proximity           | Bank transaction date; invoice due date                               |                  700 | `700` points for 0–3 calendar days apart, `300` for 4–7 days, `100` for 8–14 days, otherwise `0`.                  |

The maximum is exactly `10,000` basis points. Confidence is an integer; it is
never represented as a floating-point percentage. For example, `9,600` is shown
to a user as 96%.

For the FinFlow example, a `$1,250.00` incoming transaction dated September 10
with reference `INV-2026-0182` and customer text `Acme Ltd.` can score:

```text
exact amount                 6,000
invoice number in reference  2,500
customer name                  800
due date seven days away       300
                             ------
total                         9,600 (96%)
```

### Normalization and Matching Rules

Text normalization must be shared by every scorer and test. The MVP applies, in
this order:

1. Unicode NFKC normalization.
2. Trim leading and trailing whitespace.
3. Locale-independent uppercase conversion.
4. Replace every non-letter and non-number character with one space.
5. Collapse consecutive whitespace to one space.

The invoice-number and customer-name checks use token or phrase boundaries after
that normalization. They do not use substring matching: `INV 18` must not match
`INV 180`, and `ACME` must not match `ACMEGA`.

Date proximity compares calendar dates only. It does not derive a timestamp,
apply a time zone, or inspect the time of day. The score uses the absolute
difference between the bank transaction date and invoice due date, so a payment
slightly before or after its due date is treated consistently.

### Candidate Output, Thresholds, and Ordering

The pure scoring module will return a score plus individual evidence items so a
future UI can say _why_ a candidate was suggested. Each item contains a stable
code, its awarded basis points, and a user-facing explanation; it must not
include hidden weights or raw sensitive bank data beyond the fields already
visible to the authorized user.

|        Score | Classification    | Product behavior                                                                                                   |
| -----------: | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| 9,000–10,000 | High confidence   | Display as a prominent suggestion with evidence.                                                                   |
|  7,500–8,999 | Medium confidence | Display as a suggestion; explicit user review remains required.                                                    |
|  6,500–7,499 | Low confidence    | Display after higher-confidence suggestions with a clear caution.                                                  |
|      0–6,499 | Not suggested     | Do not show as a candidate. The user may still choose an eligible invoice through the later manual-match workflow. |

Candidates sort by descending confidence, then ascending invoice due date, then
ascending invoice number, and finally ascending invoice ID. This tie-breaking
order is part of the contract: equivalent inputs produce equivalent output order.

### Inputs Intentionally Excluded

- Fuzzy text similarity, embeddings, LLM output, or probabilistic models.
- Bank transaction `externalId`, which identifies a source row but does not
  prove which invoice it settles.
- Category, vendor, or manually entered notes.
- Historical payment behavior, customer payment habits, or cash-flow forecasts.
- Any score for an ineligible invoice.

These may become separately designed enhancements, but they must not silently
change the MVP's deterministic score or its explanation contract.

## Confirmation Contract

The confirmation action in Milestone 10.2 must run in one serializable database
transaction with the established bounded retry policy. It will:

1. Load and revalidate the actor, workspace permission, bank transaction,
   bank account, invoice, and existing active reconciliations inside the
   transaction.
2. Recalculate the invoice balance and reject an ineligible or overpaid match.
3. Create exactly one positive `BANK_TRANSFER` payment for the exact bank
   transaction amount. The bank transaction's date remains the user-visible
   settlement date; the API must not invent source-time precision.
4. Recalculate invoice paid and outstanding totals and derive the invoice
   status.
5. Create the `CONFIRMED` reconciliation record.
6. Write the corresponding audit event when the Audit Log infrastructure is
   available.

If any step fails, the entire transaction rolls back. No payment, invoice state
change, or confirmed reconciliation may remain on its own.

An idempotency key will be required for confirmation. Retrying the same logical
request must return its original successful result rather than create another
payment or reconciliation.

## Cancellation and Reversal Rules

FinFlow will not expose a destructive "cancel" control for a confirmed match.
Financial records must remain explainable after a mistake is discovered.

The future reversal workflow must:

1. Require `MANAGE_FINANCIAL_DATA` and a reason note.
2. Lock and revalidate the active reconciliation, payment, invoice, and bank
   transaction in one serializable transaction.
3. Mark the reconciliation `REVERSED` and set `reversedAt`; it must not delete
   the record.
4. Reverse or void the linked payment through an explicit payment-reversal
   design, then recalculate the invoice state.
5. Preserve the original bank transaction and create an audit event linking the
   reversal actor, reason, and original reconciliation.

Until that workflow exists, a confirmed reconciliation is immutable through the
public API.

## Rejection Rules

The service must fail safely without writing anything when any of these are
true:

- The transaction, invoice, payment, or bank account belongs to another
  workspace.
- The selected bank transaction is negative, zero, or already actively
  reconciled.
- The invoice is not eligible, has no outstanding balance, or would be
  overpaid.
- The bank account and invoice currencies differ.
- A suggested confirmation has a missing or out-of-range confidence score.
- A manual confirmation supplies a confidence score.
- A duplicate request or concurrency race would create another active match.

## Acceptance Criteria for Milestone 10.1

1. Future candidate scoring can rely on these eligibility rules without
   deciding whether it may write financial data.
2. A suggested score is explainable metadata, not an automated decision.
3. The later confirmation workflow has one clear atomic boundary.
4. A reversal preserves historical evidence rather than deleting records.
5. The design explicitly rejects cross-workspace, cross-currency, negative,
   ambiguous, and overpayment matches.
