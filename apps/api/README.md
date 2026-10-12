# FinFlow API

The NestJS API is the future authoritative backend for FinFlow. It starts on
port `3001`, separately from the Next.js web application on port `3000`.

The API bootstraps its Nest module graph, owns the Prisma schema and migration
configuration, and provides a liveness endpoint at `GET /api/v1/health`. The
schema includes users and their private password credentials, workspaces,
memberships and roles, workspace-scoped customers and vendors, and the invoice,
line-item, payment, manual income/expense, banking, and reconciliation contracts.

The authentication endpoints are `POST /api/v1/auth/register`,
`POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and
`POST /api/v1/auth/logout`. Login creates a database-backed opaque session and
sets its secure `HttpOnly` cookie; the raw token is never returned in JSON.
The global authentication guard protects every endpoint except health,
registration, login, and logout. Workspace authorization is still a separate
task. `POST /api/v1/workspaces` requires a live session and creates a workspace
plus an `OWNER` membership atomically. Membership checks for existing
workspace-owned data use `WorkspaceMembershipGuard`, which supplies an
authorized workspace scope after checking the composite membership key.
`WorkspacePermissionGuard` then enforces a route's named business permission
against the current membership role. A lazy Prisma service and workspace-scoped
customer repository are available as backend patterns.

Invoice and payment amounts are stored as PostgreSQL `BIGINT` minor units; the
generated Prisma Client exposes them as TypeScript `bigint`. Line-item quantities
use `DECIMAL(18,6)`, while percentage rates use integer basis points. The schema
also uses database constraints and composite foreign keys to reject invalid money
values and cross-workspace invoice/customer/payment relationships.

Bank transactions intentionally use signed `BIGINT` minor units: positive for
money in and negative for money out. A bank-account balance will later be derived
from its opening balance and transactions, rather than duplicated in a mutable
`currentBalance` column.

Manual bank transaction creation uses
`POST /api/v1/workspaces/:workspaceId/bank-transactions`. It requires the
`MANAGE_FINANCIAL_DATA` workspace permission and an `Idempotency-Key` request
header containing a UUID. Retrying the same request returns the original
transaction with `idempotencyReplayed: true`; reusing a key with different
financial details is rejected.

`GET /api/v1/workspaces/:workspaceId/bank-transactions` lists the workspace's
bank activity with database-backed search, account, direction, date-range, and
pagination filters. It requires the `VIEW` workspace permission.

From the repository root:

```bash
npm run dev:api
npm run build:api
npm run typecheck:api
npm run check:api
npm run prisma:generate
npm run prisma:validate
npm run test:api
```

The health endpoint returns `{ "status": "ok" }` when the NestJS HTTP
application can accept requests. It is deliberately a liveness check only; it
does not report database readiness until Prisma Client is connected to NestJS.
All API endpoints use the `/api/v1` base path, validate request DTOs before
reaching business logic, and return a consistent JSON error contract. See
[the API conventions](../../docs/api-conventions.md) for the policy.

Before using any Prisma command that connects to PostgreSQL, start the local
database and configure `DATABASE_URL` in the repository root `.env.local`.
See [the local database guide](../../docs/local-database.md) for the startup and
migration workflow.

The API uses NestJS 12 and TypeScript 6 in its workspace. The web application
remains on its existing Next.js-compatible TypeScript 5 toolchain. Both share
the strict compiler conventions in `tsconfig.shared.json`.
