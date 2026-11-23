# Testing Guide

This guide records repeatable checks for FinFlow's web application and API. It
complements automated unit and API tests; browser automation and database-backed
integration coverage are still being expanded.

## Current Testing Layers

- **Web unit tests:** Run `npm run test:run` for pure money, invoice-total,
  balance, status, and web API-client behavior.
- **API unit and integration tests:** Run `npm run test:api`; API test files live
  in `apps/api/test/` and share typed fixture builders from
  `apps/api/test/factories.ts`.
- **API database isolation:** Review
  [the database isolation strategy](./api-test-database-isolation.md) before
  introducing a spec that writes to PostgreSQL.
- **Complete automated suite:** Run `npm run test:run:all` to run both suites in
  sequence.
- **Manual tests:** Use the payment-preview checklist below to verify the
  browser interaction, accessible validation feedback, and visible invoice
  updates.

The invoice payment-preview flow uses sample data and browser-session state; it
does not create a database record. API integration tests use mocked repositories
unless a test explicitly provisions an isolated database. Playwright browser
automation remains a separate follow-up.

## Payment Preview Checklist

### Setup

1. Run `npm run dev`.
2. Open `http://localhost:3000/invoices/invoice-0182`.
3. Use a fresh page load before each independent scenario. Refreshing the page
   intentionally removes every payment preview created in that browser session.

The starting invoice is `INV-2026-0182`: total `$1,250.00`, paid `$0.00`,
outstanding `$1,250.00`, status `Sent`, and due date `2026-09-22`.

### Scenario 1: Full Payment

Enter these values and select **Validate payment**:

| Field          | Value             |
| -------------- | ----------------- |
| Amount         | `1250.00`         |
| Payment method | `Bank transfer`   |
| Received date  | `2026-09-23`      |
| Reference      | `MANUAL-FULL-001` |

Expected result:

- A confirmation says that a browser-session preview was added.
- The status badge changes to `Paid`.
- `Paid` is `$1,250.00` and `Outstanding` is `$0.00`.
- Payment history contains one bank-transfer entry with the reference and amount.
- The payment form becomes unavailable because there is no outstanding balance.
- Refreshing restores the original sample invoice with no preview payment.

### Scenario 2: Partial Payment Before the Due Date

After refreshing, enter these values:

| Field          | Value                |
| -------------- | -------------------- |
| Amount         | `500.00`             |
| Payment method | `Card`               |
| Received date  | `2026-09-21`         |
| Reference      | `MANUAL-PARTIAL-001` |

Expected result:

- `Paid` is `$500.00` and `Outstanding` is `$750.00`.
- The status remains `Sent` because the selected as-of date is before the due date.
- Payment history contains the new card payment.
- The form remains available for another payment.

### Scenario 3: Complete a Partial Payment

Without refreshing after Scenario 2, enter:

| Field          | Value                |
| -------------- | -------------------- |
| Amount         | `750.00`             |
| Payment method | `Bank transfer`      |
| Received date  | `2026-09-23`         |
| Reference      | `MANUAL-PARTIAL-002` |

Expected result:

- `Paid` becomes `$1,250.00` and `Outstanding` becomes `$0.00`.
- The status becomes `Paid`, even though the as-of date is after the due date.
- Payment history contains both payments.
- The payment form is unavailable after the total is fully paid.

### Scenario 4: Reject an Overpayment

After refreshing, enter an amount of `1250.01` with a valid received date and
select **Validate payment**.

Expected result:

- The amount field displays an error that payments cannot exceed the invoice total.
- No confirmation appears.
- The totals, status, and payment history stay unchanged.

### Scenario 5: Validate Payment Availability

- Open `/invoices/invoice-0184`. Its `Draft` status prevents recording a payment.
- Open `/invoices/invoice-0180`. Its `Paid` status and zero outstanding balance
  prevent recording another payment.
- Open `/invoices/invoice-0178`. Its `Cancelled` status prevents recording a payment.

## Accessibility Checks

- Navigate the form with only the keyboard: labels, inputs, and the submit
  button must receive a visible focus indicator.
- Submit an invalid amount and confirm the error message is announced and linked
  to the amount input.
- After a valid preview payment, confirm the confirmation message is announced
  without moving focus unexpectedly.

## Regression Commands

Run these before review or a commit when you are asked to run the automated
checks:

```bash
npm run test:run
npm run test:api
npm run lint
npm run typecheck
npm run build -- --webpack
```
