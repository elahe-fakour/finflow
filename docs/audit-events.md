# Audit Events

## Purpose and Scope

Audit events are an append-only workspace history of important financial and
access-control operations. They help a workspace explain who performed an
operation and when. They are not a general application log, an immutable
accounting ledger, or proof of regulatory compliance.

The Prisma `AuditEvent` record is the source of truth for persisted events:

- `id`: generated UUID.
- `workspaceId`: tenant boundary for every query.
- `actorUserId`: authenticated user who performed the operation.
- `action`: stable, lowercase dotted action name, such as `invoice.created` or
  `reconciliation.reversed`.
- `entity` and `entityId`: the affected record type and identifier.
- `metadata`: optional, compact JSON object containing only allowlisted facts.
- `createdAt`: server-generated UTC timestamp; callers cannot backdate events.

The record is append-only through the application: there is no update or delete
API for events. A financial workflow that writes an event must write it in the
same database transaction as the operation it describes. If either write fails,
both must roll back.

## Metadata and Redaction

Metadata is optional. Writers must build it from an explicit per-action allowlist;
they must never serialize a request, response, domain entity, or exception object
wholesale. Prefer identifiers and state changes needed to understand the action,
for example `{ "fromStatus": "SENT", "toStatus": "PAID" }`.

Never store any of the following in audit metadata:

- Passwords, password hashes, session tokens, invitation tokens, API keys, or
  other credentials.
- Full bank or card account numbers, authentication headers, cookies, or
  provider secrets.
- Raw CSV rows, imported file contents, or unfiltered external-provider payloads.
- Free-form notes, invoice descriptions, customer/vendor contact details, or
  other user-entered text that is not required to explain the operation.
- Request IP addresses, user-agent strings, or full before/after entity objects.

When a financial amount is necessary to explain a change, store it as an integer
minor-unit string alongside its currency, never as a floating-point number.
Sensitive values should remain in their source record and be reached through its
workspace-scoped identifier when an authorized workflow needs them.

The audit-log API returns actor email and display name for attribution. Those
values come from the current user record; `actorUserId` is the stable identity.
Changing a user's profile does not rewrite past event records.

## Access and Retention

Audit events are scoped to the active workspace. The API requires
`workspace:view-audit-log`; the current role mapping grants that permission to
workspace owners and accountants. Members and admins do not receive it by
default. Every query must include the authorized `workspaceId`.

For the MVP, events are retained for the lifetime of the workspace. There is no
time-based purge, workspace-event deletion endpoint, or per-event edit operation.
Foreign-key restrictions also prevent deleting a referenced workspace or actor.
Any future workspace deletion or retention job must define its authorization,
redaction, export, and deletion behavior before it is implemented. This is a
product engineering baseline, not a jurisdiction-specific retention promise or
compliance claim; production use with real financial data requires an approved
retention and data-subject request process.

## Listing Contract

`GET /api/v1/workspaces/:workspaceId/audit-events` supports pagination and
optional action, actor, and date filters. Results are ordered newest first, with
the event ID as a stable tie-breaker. A date-only `from` or `to` filter covers
that full UTC calendar day. Response metadata must be rendered as plain text by
the UI; it must never be interpreted as HTML.

## Action Naming

Use stable lowercase dotted names, with the business entity first and the past
tense operation second. Examples include `invoice.created`,
`invoice.status_changed`, `payment.recorded`, `income_expense.created`,
`income_expense.updated`,
`reconciliation.confirmed`, and `reconciliation.reversed`. Do not rename an
action after it has been persisted; add a new action when its meaning changes.
