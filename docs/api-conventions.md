# API Conventions

## Status

This document defines the HTTP boundary applied by the NestJS API before
feature endpoints are added. It is intentionally small: it establishes a stable
request and error contract without introducing authentication, database access,
or financial business logic.

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
Phase 7 authorization guards will verify the authenticated actor's membership
and role before calling a feature service with a scope. Until then, there are no
database-backed HTTP endpoints that accept a workspace ID from a client.

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
unexpected server error messages or stack traces to clients.

## Authentication Endpoints

The first public authentication endpoints are intentionally limited to identity
creation and credential verification:

| Endpoint                     | Success | Purpose                                                                            |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `POST /api/v1/auth/register` | `201`   | Creates a public user and private password credential in one DB write.             |
| `POST /api/v1/auth/login`    | `200`   | Verifies credentials, sets an opaque session cookie, and returns public user data. |
| `GET /api/v1/auth/me`        | `200`   | Resolves the current public user from a live session.                              |
| `POST /api/v1/auth/logout`   | `204`   | Revokes the current session and sends a clearing cookie.                           |

Both requests validate an email address and a 15–128 character password. Login
uses `401 INVALID_CREDENTIALS` for both an unknown email and an incorrect
password. Registration maps the database's unique-email constraint to
`409 EMAIL_ALREADY_REGISTERED`.

The login cookie is opaque, `HttpOnly`, `Secure`, `SameSite=Lax`, and scoped to
`Path=/`; its raw token is never included in JSON. `GET /auth/me` returns
`401 UNAUTHENTICATED` if no live session exists. No endpoint returns a JWT or a
workspace authorization decision in this task.
