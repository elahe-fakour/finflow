# FinFlow API

The NestJS API is the future authoritative backend for FinFlow. It starts on
port `3001`, separately from the Next.js web application on port `3000`.

At this milestone the API bootstraps its Nest module graph, owns the Prisma
schema and migration configuration, and provides a liveness endpoint at
`GET /health`. The schema includes users, workspaces, memberships, and workspace
roles, workspace-scoped customers and vendors, and the invoice, line-item, and
payment persistence contract. Runtime database access, authentication, and
financial feature endpoints are introduced in their planned follow-up tasks.

Invoice and payment amounts are stored as PostgreSQL `BIGINT` minor units; the
generated Prisma Client exposes them as TypeScript `bigint`. Line-item quantities
use `DECIMAL(18,6)`, while percentage rates use integer basis points. The schema
also uses database constraints and composite foreign keys to reject invalid money
values and cross-workspace invoice/customer/payment relationships.

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

Before using any Prisma command that connects to PostgreSQL, start the local
database and configure `DATABASE_URL` in the repository root `.env.local`.
See [the local database guide](../../docs/local-database.md) for the startup and
migration workflow.

The API uses NestJS 12 and TypeScript 6 in its workspace. The web application
remains on its existing Next.js-compatible TypeScript 5 toolchain. Both share
the strict compiler conventions in `tsconfig.shared.json`.
