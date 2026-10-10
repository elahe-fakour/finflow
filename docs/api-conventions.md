# API Conventions

## Status

This document defines the HTTP boundary applied by the NestJS API. It is
intentionally small: it establishes a stable request and error contract as
financial feature endpoints are added.

## Versioning

FinFlow uses URI versioning. Product endpoints use this base path:

```text
/api/v1
```

The current liveness endpoint is `GET /api/v1/health`. New incompatible HTTP
contracts will be introduced under a new major version such as `/api/v2`; they
will not silently change the behavior of an existing version.

## Request Validation

Every controller uses NestJS's global `ValidationPipe`. Future request DTOs
define their own rules with `class-validator` decorators. The global policy:

- rejects fields that a DTO does not define;
- transforms requests into DTO instances but does not implicitly coerce values;
- omits submitted values and DTO targets from validation errors.

The no-implicit-conversion rule is important for financial inputs. An API must
not silently reinterpret strings as numeric values; money parsing and currency
rules will remain explicit domain concerns.

## Workspace-Scoped Access

Repository and service methods that operate on tenant-owned records receive an
explicit `WorkspaceScope` containing `workspaceId`. Repository queries include
that workspace ID in their `where` clause; an exact customer lookup, for
example, uses Prisma's composite `(workspaceId, id)` key.

`WorkspaceScope` is a data-selection boundary, not authorization by itself.
`WorkspaceMembershipGuard` verifies the authenticated actor's membership with
the composite `(workspaceId, userId)` key before it attaches a scope to the
request. Controllers obtain that server-authorized scope through
`@CurrentWorkspace()` and pass it to services; they do not build a scope from a
client-supplied body field.

`GET /api/v1/workspaces/:workspaceId` is the first route using this contract.
An absent membership returns `404 WORKSPACE_NOT_FOUND`, rather than a revealing
`403`, so a user cannot use the API to discover another business's workspace
identifier.

Every workspace-scoped route also declares a business permission with
`@RequireWorkspacePermission(...)`. `WorkspacePermissionGuard` runs after the
membership guard and maps the current membership role to the required
permission. It denies missing permission metadata by default. A member who
knows a workspace but lacks the required role receives
`403 WORKSPACE_PERMISSION_DENIED`.

| Permission                          | Owner | Admin | Accountant | Member |
| ----------------------------------- | ----- | ----- | ---------- | ------ |
| View workspace data                 | Yes   | Yes   | Yes        | Yes    |
| Manage workspace settings           | Yes   | Yes   | No         | No     |
| Manage financial data               | Yes   | Yes   | Yes        | No     |
| Manage members                      | Yes   | Yes   | No         | No     |
| Manage ownership / critical control | Yes   | No    | No         | No     |

The first privileged route is `PATCH /api/v1/workspaces/:workspaceId`; it
renames a workspace and requires `MANAGE_SETTINGS`. Future routes must not
compare role names inside their controllers; they must declare the business
permission they require instead.

## Transactional Financial Workflows

Any service operation that changes more than one financial fact uses
`PrismaService.withTransaction`. It runs the callback with PostgreSQL
`Serializable` isolation, a bounded wait and timeout, and up to two retries for
Prisma's `P2034` write-conflict/deadlock error.

Repositories receive the transaction client as their final optional argument
when they participate in a transaction. All reads and writes that must be
atomic use that same client. Do not start a transaction for a simple independent
read or write.

The transaction callback must contain only retry-safe database work. It must not
send email, call a payment provider, or publish an external message, because a
serialization conflict can run it more than once. A later outbox design will
handle durable external side effects after commit.

## Error Response Contract

Every HTTP error uses the following JSON shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed.",
  "details": [
    {
      "field": "email",
      "messages": ["email must be an email"]
    }
  ],
  "path": "/api/v1/customers",
  "timestamp": "2026-10-03T12:00:00.000Z"
}
```

`details` is present only when there are safe, structured details to return,
such as validation failures. The global exception filter does not expose
unexpected server error messages or stack traces to clients. A guard-generated
HTTP `401` without a more specific code is normalized to `UNAUTHENTICATED`.

## Authentication Endpoints

Authentication is default-deny: all API endpoints require a live session unless
they explicitly use `@Public()`. The initial public routes are intentionally
limited to liveness and the authentication lifecycle:

| Endpoint                     | Success | Purpose                                                                            |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `POST /api/v1/auth/register` | `201`   | Creates a public user and private password credential in one DB write.             |
| `POST /api/v1/auth/login`    | `200`   | Verifies credentials, sets an opaque session cookie, and returns public user data. |
| `GET /api/v1/auth/me`        | `200`   | Resolves the current public user from a live session.                              |
| `POST /api/v1/auth/logout`   | `204`   | Revokes the current session and sends a clearing cookie.                           |

`GET /api/v1/health` is also public so deployment health checks do not require a
user session. Logout is public only to clear expired browser cookies; it revokes
a live session when supplied.

Both requests validate an email address and a 15–128 character password. Login
uses `401 INVALID_CREDENTIALS` for both an unknown email and an incorrect
password. Registration maps the database's unique-email constraint to
`409 EMAIL_ALREADY_REGISTERED`.

The login cookie is opaque, `HttpOnly`, `Secure`, `SameSite=Lax`, and scoped to
`Path=/`; its raw token is never included in JSON. `GET /auth/me` returns
`401 UNAUTHENTICATED` if no live session exists. No endpoint returns a JWT or a
workspace authorization decision in this task.

## Workspace Creation

`POST /api/v1/workspaces` requires a live session and accepts a single `name`
field. It creates the workspace and a `WorkspaceMembership` for the
authenticated user with the `OWNER` role in one serializable transaction. The
response contains the workspace's generated ID, display name, unique slug,
creation timestamp, and the confirmed `OWNER` role.

The slug is generated by the server from the name plus a random suffix. Clients
never select a slug, so they cannot overwrite or claim another workspace's URL
identifier. The unique database constraint remains the final concurrency check;
the service retries the extremely unlikely generated-slug collision.

This endpoint establishes ownership. Existing workspace access is verified by
`WorkspaceMembershipGuard` and the route's declared permission is enforced by
`WorkspacePermissionGuard`.

`GET /api/v1/workspaces` returns only the workspaces where the authenticated
user has a membership, ordered by workspace name. It includes the member's role
for each workspace, so the web application can select an active workspace
without treating a client-provided ID as authorization.

## Income and Expense Category Endpoints

Income and expense categories are scoped below their workspace:

| Endpoint                                                                       | Permission              | Purpose                                                        |
| ------------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------- |
| `GET /api/v1/workspaces/:workspaceId/income-expense-categories`                | `VIEW`                  | Lists a workspace's categories; `type` may filter the results. |
| `POST /api/v1/workspaces/:workspaceId/income-expense-categories`               | `MANAGE_FINANCIAL_DATA` | Creates an `INCOME` or `EXPENSE` category.                     |
| `GET /api/v1/workspaces/:workspaceId/income-expense-categories/:categoryId`    | `VIEW`                  | Reads one category in the current workspace.                   |
| `PATCH /api/v1/workspaces/:workspaceId/income-expense-categories/:categoryId`  | `MANAGE_FINANCIAL_DATA` | Renames a category; its type is immutable.                     |
| `DELETE /api/v1/workspaces/:workspaceId/income-expense-categories/:categoryId` | `MANAGE_FINANCIAL_DATA` | Deletes an unused category.                                    |

The API trims category names, rejects blank names and unsupported types, and
maps a duplicate `(workspaceId, type, name)` to `409 CATEGORY_NAME_ALREADY_EXISTS`.
Deleting a category referenced by an income or expense entry returns
`409 CATEGORY_IN_USE`; it does not silently delete or recategorize financial
history.

## Vendor Options for Expense Entries

| Endpoint                                      | Permission | Purpose                                                              |
| --------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `GET /api/v1/workspaces/:workspaceId/vendors` | `VIEW`     | Lists the current workspace's vendor IDs and names, ordered by name. |

This intentionally small read endpoint supplies the optional vendor selector
when recording an expense. It returns only vendors from the authorized
workspace; it does not introduce vendor creation or editing workflows.

## Income and Expense Entry Endpoints

Manual income and expense entries are also scoped below their workspace:

| Endpoint                                                                | Permission              | Purpose                                                                                      |
| ----------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `GET /api/v1/workspaces/:workspaceId/income-expense-entries`            | `VIEW`                  | Lists entries with bounded pagination and optional date, type, vendor, and category filters. |
| `POST /api/v1/workspaces/:workspaceId/income-expense-entries`           | `MANAGE_FINANCIAL_DATA` | Records one manual income or expense entry.                                                  |
| `GET /api/v1/workspaces/:workspaceId/income-expense-entries/:entryId`   | `VIEW`                  | Reads one entry in the current workspace.                                                    |
| `PATCH /api/v1/workspaces/:workspaceId/income-expense-entries/:entryId` | `MANAGE_FINANCIAL_DATA` | Updates a manual entry after revalidating its relationships.                                 |

`amountMinorUnits` is a positive integer **string** in requests and responses.
The service converts it to PostgreSQL `BIGINT` with `BigInt`; JSON never carries
financial amounts as JavaScript floating-point values. FinFlow currently accepts
only `USD`.

`categoryId` is required when an entry is created. The category must be in the
same workspace and have the same `INCOME` or `EXPENSE` type as the entry. A
`vendorId`, when present, must be in the same workspace and is valid only for an
expense. Dates use the calendar-only `YYYY-MM-DD` format.

The list defaults to `page=1` and `pageSize=25`; `pageSize` is capped at `100`.
Financial entries intentionally have no hard-delete endpoint. A future audited
void/reversal workflow will preserve the original fact and its traceability.

The web application currently exposes an edit flow for permitted workspace
members. It uses `PATCH` and repeats the same category, vendor, currency, date,
and money validation as creation. It does not expose a delete control because a
financial correction must remain traceable.
