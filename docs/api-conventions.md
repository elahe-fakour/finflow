# API Conventions

## Status

This document defines the HTTP boundary applied by the NestJS API. It is
intentionally small: it establishes a stable request and error contract before
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
identifier. Role-based permissions are intentionally deferred to the next task;
at this stage any workspace member may pass this membership guard.

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
`WorkspaceMembershipGuard`; role-based permission checks are the next task in
this milestone.
