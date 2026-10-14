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
