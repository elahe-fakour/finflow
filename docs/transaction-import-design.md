# Bank Transaction CSV Import Design

## Status

Design approved for implementation in Phase 9, Milestone 9.2, Task 5. This
document defines the import contract before any CSV parser, upload endpoint, or
database migration is introduced.

## Goal

Allow an authorized user to import bank transaction activity from a CSV file
into one selected FinFlow bank account. The workflow must make every row
reviewable before persistence, prevent accidental duplicate imports, and retain
enough provenance to explain where an imported transaction came from.

This is a bank-data ingestion feature. It does not reconcile a transaction to
an invoice or payment, infer a category, or create accounting entries.

## MVP Scope

- One CSV file and one selected, active bank account per import.
- UTF-8, comma-delimited CSV only in the first version.
- A fixed header-based mapping for these canonical fields:
  `transactionDate`, `description`, `amount`, and optional `reference` and
  `externalId`.
- A preview containing normalized values, row-level errors, and duplicate
  warnings before confirmation.
- Persist only after an explicit confirmation request.
- Store a batch record and source fingerprint for every imported transaction.
- Require the workspace `MANAGE_FINANCIAL_DATA` permission for preview and
  confirmation.

## Explicitly Out of Scope

- Automatic column mapping or arbitrary user-defined mappings.
- XLSX, OFX, QIF, PDF, image, and OCR imports.
- Multiple currencies or exchange-rate conversion.
- Importing directly into an archived bank account.
- Automatic category assignment.
- Automatic invoice/payment reconciliation.
- Editing source transaction values during preview.
- Reversing or deleting an imported transaction. Those need an audited
  reversal workflow in a later phase.

## Canonical CSV Contract

The first implementation accepts this header row, in any column order:

```csv
transactionDate,description,amount,reference,externalId
```

`reference` and `externalId` are optional. Unknown columns are ignored. Missing
required headers make the whole file invalid; the user must correct the file
before an import preview is created.

### Field Rules

| Field             | Required | Rule                                                                                                     |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `transactionDate` | Yes      | Calendar date in `YYYY-MM-DD`. No locale-dependent dates.                                                |
| `description`     | Yes      | Trimmed non-empty text, maximum 1,000 characters.                                                        |
| `amount`          | Yes      | Signed ASCII decimal with no thousands separators, for example `1250.00` or `-1250.00`. Zero is invalid. |
| `reference`       | No       | Trimmed non-empty text when present, maximum 100 characters.                                             |
| `externalId`      | No       | Stable bank/provider row identifier when available, maximum 255 characters.                              |

The selected bank account determines the currency. The initial implementation
supports USD only. Amount parsing converts decimal text directly into signed
integer minor units with `BigInt`; it must never use `Number`, `parseFloat`, or
decimal arithmetic.

Positive amounts are inflows and negative amounts are outflows. An import file
with separate debit and credit columns is intentionally rejected in the MVP
rather than guessed incorrectly.

## Preview and Confirmation Workflow

```text
Select active bank account + choose CSV
              │
              ▼
Parse headers and rows in memory
              │
              ▼
Normalize fields, validate rows, detect duplicates
              │
              ▼
Show preview: valid rows, errors, duplicates, totals
              │
              ▼
User explicitly confirms the reviewed import
              │
              ▼
Persist batch + all eligible rows in one database transaction
```

Preview data is temporary. It must not create bank transactions, import batches,
or audit records. Confirmation uses a short-lived server-side preview token;
the client must not send back a trusted copy of parsed rows.

The confirmation action is disabled while any row has an error or duplicate
state. Duplicate rows remain visible in the preview as warnings, but the user
must remove those rows from the file or import a corrected file; the MVP
provides no "force duplicate" option.

This all-or-nothing confirmation rule avoids a partially imported statement
whose omissions are difficult to explain later.

## Duplicate Detection

`Idempotency-Key` and import deduplication solve different problems:

| Mechanism                 | Prevents                                  | Lifetime            |
| ------------------------- | ----------------------------------------- | ------------------- |
| `Idempotency-Key`         | Replaying one create/confirm HTTP request | One logical request |
| import source fingerprint | Re-importing the same bank statement row  | Persistent          |

For each normalized row, the import service builds a deterministic source
fingerprint:

1. If `externalId` is supplied, use a normalized combination of the selected
   bank account and that external ID.
2. Otherwise hash the selected bank account, date, signed minor-unit amount,
   normalized description, and normalized reference with SHA-256.

The selected account is part of the fingerprint because the same payment may
legitimately appear in distinct accounts. A matching fingerprint already stored
in the workspace is a duplicate warning. A repeated fingerprint inside the
uploaded file is a row error.

Fingerprint matching is conservative: two genuinely separate but identical bank
lines may be flagged. The MVP will not silently import an ambiguous duplicate.

## Planned Persistence Model

Task 5 will add a version-controlled Prisma migration rather than altering the
database manually. The expected shape is:

```text
BankTransactionImportBatch
  id, workspaceId, bankAccountId, fileName, importedByUserId,
  importedAt, rowCount, importedRowCount

BankTransaction
  importBatchId?        -> BankTransactionImportBatch
  importSourceFingerprint?  (unique per workspace and account)
  externalId?           (provider value when supplied)
```

The final migration must use workspace-aware composite foreign keys and a
database unique constraint for the fingerprint. Application-level duplicate
checks improve the preview; the database constraint remains the last line of
defense against concurrent confirmations.

The batch preserves provenance without retaining the original CSV file in the
initial MVP. File storage, encrypted raw-file retention, and a downloadable
error report need their own security and retention decisions.

## Validation and Error Model

Each preview row has one of these states:

- `VALID`: can be imported if the complete preview contains no errors.
- `ERROR`: cannot be imported; includes a stable error code and human-readable
  message.
- `DUPLICATE`: matches a persisted fingerprint and will not be imported.

Initial error codes:

```text
CSV_REQUIRED_HEADER_MISSING
CSV_INVALID_ENCODING
CSV_INVALID_ROW_STRUCTURE
CSV_INVALID_TRANSACTION_DATE
CSV_INVALID_AMOUNT
CSV_ZERO_AMOUNT
CSV_DESCRIPTION_REQUIRED
CSV_REFERENCE_TOO_LONG
CSV_EXTERNAL_ID_TOO_LONG
CSV_DUPLICATE_WITHIN_FILE
CSV_BANK_TRANSACTION_ALREADY_IMPORTED
CSV_BANK_ACCOUNT_ARCHIVED
```

The preview response also exposes row counts and exact signed totals for valid,
duplicate, and invalid rows. Totals are integer minor-unit strings, not JSON
numbers.

## Authorization and Integrity

- The backend resolves the workspace from the authenticated session and checks
  `MANAGE_FINANCIAL_DATA` on preview and confirmation routes.
- The selected bank account is looked up within that same workspace and must be
  `ACTIVE`.
- Confirming an import runs under a database transaction with serializable
  isolation and a bounded retry, using the existing financial transaction
  helper.
- The confirmation request also carries an `Idempotency-Key` so a browser retry
  cannot create two import batches.
- A later Audit Log phase will emit a dedicated import-confirmed event. Until
  then, the batch metadata supplies limited operational provenance; it is not a
  substitute for the audit log.

## API Shape for Task 5

Names are proposed, not implemented by this design task:

```text
POST /api/v1/workspaces/:workspaceId/bank-transaction-imports/preview
POST /api/v1/workspaces/:workspaceId/bank-transaction-imports/confirm
```

`preview` accepts multipart file data and `bankAccountId`. `confirm` accepts a
server-issued preview token and an `Idempotency-Key` header. Neither endpoint
accepts client-computed minor units, fingerprints, or validation results as a
trusted source.

## Acceptance Criteria for Task 5

1. A valid CSV can be previewed without writing bank transactions.
2. The preview identifies invalid rows with their original row number and a
   stable error code.
3. Confirmation is unavailable while the preview contains errors.
4. Confirming a valid preview creates one batch and all its transactions in one
   database transaction.
5. Replaying confirmation with the same idempotency key returns the original
   result without creating another batch.
6. Re-importing the same source row is detected by a database-backed
   fingerprint constraint.
7. A bank account from another workspace can never be associated with imported
   transactions.
8. Unit tests cover amount parsing, fingerprint construction, and row
   validation; integration tests cover confirmation atomicity and duplicates.
