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
