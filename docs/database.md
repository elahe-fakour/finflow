# FinFlow Database Design

## Status and Source of Truth

This document describes the PostgreSQL persistence contract through Phase 7,
Milestone 7.1, Task 2. It is a guide for contributors and reviewers. The
executable source of truth is:

- [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) for Prisma
  models, relations, and indexes.
- [`apps/api/prisma/migrations/`](../apps/api/prisma/migrations/) for the
  versioned PostgreSQL schema, including custom constraints and partial indexes.

The NestJS API has a lazily initialized Prisma service, a workspace-scoped
customer repository pattern, and registration/login endpoints. Private password
hashes are stored separately from public user data. Session persistence,
authorization, financial CRUD endpoints, and audit-event writing remain in their
planned milestones.

## Design Goals

- Keep every tenant-owned financial record scoped to one workspace.
- Store money exactly, without JavaScript floating-point arithmetic.
- Let PostgreSQL reject invalid cross-workspace references and basic invalid
  financial states.
- Preserve facts and history instead of relying on mutable derived values.
- Keep the first schema small enough to evolve without introducing a general
  ledger or unsupported multi-currency conversion prematurely.

## Relationship Map

```text
User -- UserCredential
User --< WorkspaceMembership >-- Workspace
Workspace --< Customer --< Invoice --< InvoiceLineItem
                         |
                         +--< Payment --< Reconciliation >-- BankTransaction
Workspace --< Vendor --< IncomeExpenseEntry
Workspace --< BankAccount --< BankTransaction
```

`Reconciliation` connects a bank transaction to an invoice payment. It does not
yet reconcile bank transactions to manual income/expense entries; that workflow
will be designed explicitly in the reconciliation milestone.

## Model Map

| Area              | Models                                  | Purpose                                                                                                      |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Identity          | `User`, `UserCredential`                | Separates public identity data from the private password hash for local credentials.                         |
| Workspace access  | `Workspace`, `WorkspaceMembership`      | Represents businesses and workspace-specific roles for users.                                                |
| Contacts          | `Customer`, `Vendor`                    | Holds invoice customers and expense vendors.                                                                 |
| Invoicing         | `Invoice`, `InvoiceLineItem`, `Payment` | Stores invoice snapshots, their line-level calculation inputs/results, and recorded payments.                |
| Manual operations | `IncomeExpenseEntry`                    | Stores a positive manual income or expense amount, date, description, currency, and optional expense vendor. |
| Banking           | `BankAccount`, `BankTransaction`        | Stores financial accounts, opening balances, and signed transaction facts.                                   |
| Reconciliation    | `Reconciliation`                        | Records suggested or manual matches between bank transactions and payments, including reversal history.      |

## Workspace Isolation

`workspace_id` exists on every tenant-owned record. This supports a simple,
consistent authorization query shape: the future API will first verify the
actor's `WorkspaceMembership`, then query or mutate only records for that same
workspace.

PostgreSQL also protects important relationships with composite foreign keys:

| Relationship                                       | Protected rule                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `Invoice` → `Customer`                             | An invoice cannot reference a customer in a different workspace.    |
| `Payment` → `Invoice`                              | A payment cannot reference an invoice in a different workspace.     |
| `IncomeExpenseEntry` → `Vendor`                    | An expense cannot reference a vendor in a different workspace.      |
| `BankTransaction` → `BankAccount`                  | A transaction cannot reference an account in a different workspace. |
| `Reconciliation` → `BankTransaction` and `Payment` | A reconciliation cannot join facts from different workspaces.       |

These constraints are defense in depth. They do not replace backend authorization:
an authenticated user still must be a member with a sufficient role before an API
operation is allowed.

## Money Storage Strategy

### Why integer minor units

Database monetary amounts use PostgreSQL `BIGINT`; Prisma exposes these values to
the API as TypeScript `bigint`. For USD, `$12.50` is stored as `1250` minor
units. Addition and subtraction of integers are exact, unlike binary floating
point arithmetic such as `0.1 + 0.2`.

The frontend money utility currently uses safe JavaScript integers for its
browser-only sample workflow. At the API boundary, a future service must:

1. validate the input currency and amount;
2. convert it to `bigint` before persistence;
3. serialize `bigint` values as strings in JSON responses, because JSON does not
   represent JavaScript `bigint` directly.

No conversion rate, foreign-exchange gain/loss, or multi-currency aggregation is
implemented in the MVP. A currency code is still stored beside each independent
monetary fact so a later service can reject incompatible arithmetic.

### Stored numeric values

| Value                                         | PostgreSQL type        | Sign rule                   | Notes                                                         |
| --------------------------------------------- | ---------------------- | --------------------------- | ------------------------------------------------------------- |
| Invoice totals, line prices, discounts, taxes | `BIGINT`               | Non-negative                | Snapshot values support traceable invoice calculations.       |
| Payments                                      | `BIGINT`               | Strictly positive           | A reversal will be a separate, explicit future workflow.      |
| Income and expense entries                    | `BIGINT`               | Strictly positive           | The `entry_type` supplies the business meaning.               |
| Bank opening balance                          | `BIGINT`               | Signed                      | An account can start overdrawn.                               |
| Bank transaction                              | `BIGINT`               | Non-zero signed             | Positive means money in; negative means money out.            |
| Quantity                                      | `DECIMAL(18,6)`        | Strictly positive           | Quantity is not money and allows up to six fractional digits. |
| Percentage rates                              | `INTEGER` basis points | Non-negative                | `100` means 1%; a percentage discount is capped at `10,000`.  |
| Reconciliation confidence                     | `INTEGER` basis points | `0`–`10,000` when suggested | `9,600` represents a 96% suggestion confidence.               |

### Derived values

`BankAccount` intentionally has no mutable `currentBalance` column. A future
read model calculates it from:

```text
openingBalanceMinorUnits + sum(bankTransaction.amountMinorUnits)
```

This prevents a stored balance from drifting when a transaction is inserted,
edited, imported, or reversed.

Invoice paid and outstanding amounts are also derived from the invoice total and
recorded payments. The payment service will calculate these values and update an
invoice's workflow status inside one database transaction.

## Database-Enforced Invariants

Prisma describes the models, but selected PostgreSQL rules are added in migration
SQL because they cannot be fully represented in the Prisma schema.

| Area                  | Database rule                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and tenancy  | UUID primary keys, workspace-scoped unique names/numbers, and composite foreign keys protect record ownership.                                                                   |
| Currency              | Persisted currency values must be three uppercase letters.                                                                                                                       |
| Invoice               | Number is non-blank; due date is not before issue date; totals are non-negative; discount does not exceed subtotal; total equals subtotal minus discount plus tax.               |
| Invoice line          | Position and quantity are positive; price and totals are non-negative; discount fields have one valid shape; line total equals subtotal minus discount plus tax.                 |
| Payment               | Amount is strictly positive.                                                                                                                                                     |
| Income/expense        | Amount is strictly positive; description is non-blank; a vendor may be attached only to an `EXPENSE` entry.                                                                      |
| Bank account          | Name is non-blank; a stored account suffix is exactly four digits; full account numbers are not stored.                                                                          |
| Bank transaction      | Amount is never zero; description and non-null external IDs are non-blank; a non-null external ID is unique within its bank account.                                             |
| Reconciliation        | Suggested matches require a `0`–`10,000` confidence value; manual matches have no synthetic confidence; a confirmed record has no reversal timestamp; a reversed record has one. |
| Active reconciliation | Partial unique indexes allow only one `CONFIRMED` reconciliation per bank transaction and per payment, while preserving prior `REVERSED` records.                                |

## Rules Deferred to the Service Layer

Database constraints cannot safely express every cross-row or authorization rule.
The future NestJS service layer must enforce the following inside transactions
where multiple records change:

- Verify authentication and workspace role before every read or mutation.
- Validate allowed invoice status transitions and prevent payment overpayment.
- Confirm that a reconciled bank transaction is eligible, represents an incoming
  amount, and matches the intended payment amount and currency.
- Create payment, update invoice balance/status, confirm reconciliation, and
  write the audit event atomically when a workflow requires all of them.
- Define the exact reconciliation reversal policy and create a durable audit
  event for it.
- Validate supported ISO currency codes and any jurisdiction-specific tax rules.

FinFlow's transaction helper uses PostgreSQL `Serializable` isolation for these
multi-record financial workflows. It retries the known Prisma write-conflict
code (`P2034`) a bounded number of times. Transaction callbacks must contain
only database work: external side effects are not retry-safe and belong after a
successful commit.

The database model is deliberately not a double-entry general ledger. That is a
separate accounting architecture decision outside this MVP.

## Migration Workflow

For a schema change, make the Prisma schema change first, then create a named
migration in local development:

```bash
npm run prisma:migrate:dev -- --name describe-the-change
```

Review the generated `migration.sql`. If PostgreSQL-specific constraints or
partial indexes are necessary, create a draft migration with `--create-only`,
edit its SQL, then apply it. Commit the schema and its migration together; never
rewrite an already-applied migration.

Useful verification commands:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:status
```

Use `npm run prisma:migrate:deploy` only to apply committed migrations in
deployment environments. Do not use `prisma db push` for FinFlow's tracked
financial schema because it bypasses reviewable migration history.

## Deliberately Not Modeled Yet

- Workspace-scoped categories and category CRUD (Phase 8)
- Attachment/file storage for receipts or income/expense evidence
- CSV import source metadata beyond `BankTransaction.externalId`
- Exchange rates and multi-currency conversion
- A general ledger or tax-jurisdiction engine
- API authorization, audit events, and reconciliation scoring behavior

These omissions are intentional. Each becomes a separate task when its business
rules and operational requirements are clear.
