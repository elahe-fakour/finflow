# Testing Guide

This guide records repeatable checks for FinFlow while the application is still
frontend-only. It complements the automated financial unit tests.

## Current Testing Layers

- **Unit tests:** Run `npm run test:run` to verify pure money, invoice-total,
  balance, and status rules.
- **Manual tests:** Use the payment-preview checklist below to verify the
  browser interaction, accessible validation feedback, and visible invoice
  updates.

Browser automation is intentionally deferred until Phase 13. The payment flow
currently uses sample data and browser-session state only; it does not create a
database record.

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

Run these before review or a commit:

```bash
npm run test:run
npm run lint
npm run typecheck
npm run build -- --webpack
```
