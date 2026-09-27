# FinFlow Architecture

## Status and Scope

This document describes the architecture that exists today and the boundaries that
will guide its evolution. FinFlow currently contains a Next.js web application,
a bootstrapped NestJS API, local PostgreSQL Compose definition, and Prisma
schema/migration configuration. The API has no runtime database integration,
authentication, or financial endpoints yet.

The complete delivery sequence is maintained in [plan.md](../plan.md).

## Current Architecture

```text
Browser
  │
  ▼
Next.js web application
  ├─ App Router routes and layouts
  ├─ React UI components
  ├─ Tailwind CSS styles
  └─ Static assets

NestJS API (`apps/api`)
  ├─ Module composition and dependency injection
  ├─ HTTP application bootstrap on port 3001
  └─ Liveness endpoint at GET /health

Local PostgreSQL (`compose.yaml`)
  ├─ Docker Compose service on port 5432 by default
  ├─ Configuration from ignored `.env.local`
  └─ Named volume for local development data

Prisma (`apps/api/prisma`)
  ├─ PostgreSQL datasource and generated client configuration
  ├─ Version-controlled migrations (when models are introduced)
  └─ Connection URL from ignored root `.env.local`
```

The web source lives in `src/`, with the App Router in `src/app`. The API lives
beside it as an npm workspace in `apps/api`:

```text
src/app/
  layout.tsx       # Root document, metadata, fonts, and global styles
  globals.css      # Global styles and Tailwind entry point
  (app)/           # URL-neutral route group for application routes
    layout.tsx     # Shared application shell
    page.tsx       # Route for /

src/features/
  invoices/        # Frontend invoice domain contracts

public/          # Static files served by Next.js
apps/api/         # NestJS API application
```

The `(app)` route group does not affect URLs. It scopes the application shell to
the product routes so future authentication pages can use a different layout. The
App Router makes Server Components the default. Client Components will be used only
when browser-only interactivity is required. At this stage, the application shell
contains no business logic, data fetching, or client-side state.

## Current Boundaries

- **Presentation:** React components render pages and collect user input.
- **Routing and layout:** Next.js App Router owns route composition and shared UI
  structure.
- **Styling:** Tailwind CSS and global CSS provide the visual layer.
- **Invoice domain contracts:** Frontend-only types describe invoices, line items,
  payments, and money representations before calculation logic is introduced.
- **Money contract:** `src/features/invoices/money.ts` is the single source for
  the `Money` representation and safe same-currency arithmetic.
- **Invoice calculations:** `src/features/invoices/invoice-calculations.ts`
  contains pure subtotal, discount, tax, and invoice-total functions; React
  components must consume their results rather than reproduce their logic.
- **API bootstrap:** `apps/api` is a separate NestJS application that will own
  backend financial workflows. It uses its own TypeScript 6 toolchain so the
  existing Next.js application can remain on TypeScript 5.
- **API liveness contract:** `GET /health` confirms that NestJS can accept HTTP
  requests. Its integration test bootstraps the real module graph and sends an
  HTTP request in memory; it does not depend on a running PostgreSQL instance.
- **Local database runtime:** `compose.yaml` defines PostgreSQL only. It is not
  connected to the API yet, and neither the API nor the web application is
  containerized at this stage.
- **Database schema and migrations:** Prisma owns the PostgreSQL datasource,
  generated client configuration, and SQL migration history. The initial
  migrations model users, workspaces, explicit workspace memberships with roles,
  and workspace-scoped customers and vendors.
- **Workspace access boundary:** Every future financial record will belong to a
  workspace. `WorkspaceMembership` is the backend authorization lookup between
  a user, a workspace, and its role; it uses database constraints and indexes,
  not UI-only checks.
- **Contact-data boundary:** Customer and vendor records belong to exactly one
  workspace. Their names are unique within that workspace, while shared finance
  email addresses remain valid across distinct records.
- **Quality checks:** Prettier, ESLint/Oxlint, TypeScript, Vitest unit tests,
  and production builds provide the initial feedback loop.

There is no API feature layer, runtime database integration, authentication, or
authorization yet. The local PostgreSQL startup and data-retention procedure is
documented in [local-database.md](./local-database.md). Database readiness will
be added to the health contract only once API database access exists.
The pure invoice calculation module is covered by focused unit tests; the UI
must not pretend that persistence or complete financial workflows already exist.

## Planned Evolution

The architecture will grow only when a milestone needs the new responsibility:

```text
Browser
  │
  ▼
Next.js web application
  ├─ Server-rendered pages and interactive client UI
  └─ Typed API client
        │
        ▼
NestJS API
  ├─ Authentication and workspace authorization
  ├─ Feature modules and business services
  └─ Validation, error handling, and audit-event creation
        │
        ▼
PostgreSQL via Prisma
  ├─ Workspace-scoped data
  ├─ Database constraints and indexes
  └─ Transactions for multi-record financial operations
```

The API and database are intentionally deferred until the frontend information
architecture and workflows justify them. This keeps the early codebase simple while
preserving a clear path to a production-oriented separation of concerns.

## Financial Design Principles

When financial features are introduced:

- Monetary values will use integer minor units and an ISO currency code, not
  JavaScript floating-point arithmetic.
- Money representation and arithmetic invariants are documented in
  [fintech-concepts.md](./fintech-concepts.md).
- Financial business rules will live outside React components.
- Multi-record financial changes will use database transactions.
- Workspace access control will be enforced by the backend, not only hidden in the
  UI.
- Important financial operations will create audit events.

## Architectural Change Policy

Update this document when a meaningful boundary, deployment shape, or ownership
decision changes. Record significant, long-lived trade-offs as Architecture Decision
Records in `docs/adr/` when that directory is introduced.
