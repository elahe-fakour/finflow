# FinFlow Architecture

## Status and Scope

This document describes the architecture that exists today and the boundaries that
will guide its evolution. FinFlow currently contains a Next.js web application,
a bootstrapped NestJS API, local PostgreSQL Compose definition, and Prisma
schema/migration configuration. The API has a lazy Prisma database boundary,
database-backed opaque-session authentication, and a protected workspace
creation endpoint. Financial workflows and membership checks for existing
workspace data remain planned work.

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
  ├─ Global validation and consistent error responses
  ├─ Database-backed opaque session authentication
  ├─ Protected workspace creation with an atomic owner membership
  ├─ Liveness endpoint at GET /api/v1/health
  └─ Readiness endpoint at GET /api/v1/ready

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
- **Authentication boundary:** The approved authentication design uses the
  NestJS API as the session authority and database-backed opaque cookies rather
  than browser-stored bearer tokens. The Next.js application exposes narrow,
  same-origin BFF authentication routes and validates the current session while
  rendering protected pages. Authentication identifies a user; Phase 7 workspace
  guards will still authorize every workspace action. The design and rollout
  sequence are documented in [authentication.md](./authentication.md).
- **API HTTP boundary:** All API routes use URI versioning under `/api/v1`.
  A global validation pipe rejects undeclared request fields and avoids implicit
  type coercion. A global exception filter returns a documented, consistent JSON
  error shape without leaking unexpected server errors. See
  [api-conventions.md](./api-conventions.md).
- **API health contract:** `GET /api/v1/health` confirms that NestJS can accept
  HTTP requests without connecting to PostgreSQL. `GET /api/v1/ready` checks
  PostgreSQL and returns `503` when the API cannot serve database-backed work.
- **Local database runtime:** `compose.yaml` defines PostgreSQL only. The API
  reads its ignored root `.env.local` in local development and connects lazily
  when a database-backed endpoint needs it; neither application is containerized
  at this stage.
- **Database schema and migrations:** Prisma owns the PostgreSQL datasource,
  generated client configuration, and SQL migration history. The current
  migrations model users, workspaces, explicit workspace memberships with roles,
  workspace-scoped contacts, invoices, invoice line items, payments,
  income/expense categories and entries, bank accounts, bank transactions, and
  reconciliation records. The current model map and persistence invariants are documented in
  [database.md](./database.md).
- **Workspace access boundary:** Every future financial record will belong to a
  workspace. `WorkspaceMembership` is the backend authorization lookup between
  a user, a workspace, and its role; it uses database constraints and indexes,
  not UI-only checks. The protected workspace-creation service establishes the
  first `OWNER` membership atomically with its workspace. It does not replace
  membership verification for existing workspaces. `WorkspaceMembershipGuard`
  now verifies the current user against that composite membership key and
  attaches an authorized scope before a controller invokes a service.
  `WorkspacePermissionGuard` then evaluates an explicit business permission
  against the current role; its central matrix is documented in
  [ADR 0005](./adr/0005-adopt-workspace-role-permissions.md).
- **Workspace-scoped repository boundary:** `WorkspaceScope` is required by
  tenant-owned repository and service methods. The first example,
  `CustomersRepository`, uses a composite workspace/customer key for exact
  lookups and always filters lists by `workspaceId`. `PrismaService` constructs
  its client lazily, so the liveness endpoint remains independent of PostgreSQL.
  Phase 7 guards will provide an authorized scope before feature services run.
- **Transactional workflow boundary:** Multi-record financial workflows use
  `PrismaService.withTransaction`, which provides serializable isolation and a
  bounded retry for database write conflicts. Repositories receive the same
  transaction client so their related reads and writes are atomic; external
  side effects remain outside the retried callback.
- **Contact-data boundary:** Customer and vendor records belong to exactly one
  workspace. Their names are unique within that workspace, while shared finance
  email addresses remain valid across distinct records.
- **Invoice persistence boundary:** Invoice and payment amounts use PostgreSQL
  `BIGINT` minor units (Prisma `bigint`), quantities use `DECIMAL(18,6)`, and
  rates use integer basis points. Composite foreign keys prevent associating an
  invoice with a customer from another workspace or a payment with an invoice
  from another workspace. Database constraints also protect non-negative money,
  valid discounts, and invoice total arithmetic.
- **Banking and reconciliation boundary:** Bank-transaction amounts are signed
  `BIGINT` minor units, whereas recorded payments remain positive. A bank-account
  balance is derived from its opening balance and transactions. Composite foreign
  keys isolate transactions, payments, and reconciliations by workspace; partial
  unique indexes allow only one confirmed reconciliation per transaction or
  payment while retaining reversed history. The reconciliation invariants,
  state transitions, and reversal contract are defined in
  [reconciliation-design.md](./reconciliation-design.md) before scoring and
  workflow code is introduced.
- **Quality checks:** Prettier, ESLint/Oxlint, TypeScript, Vitest unit tests,
  and production builds provide the initial feedback loop. The workspace
  isolation test composes the real membership and permission guards with two
  distinct users and workspaces, and proves a cross-workspace request cannot
  invoke a service method. A dedicated API integration-test database strategy
  remains planned for Phase 13.

The API now has authentication and a minimal workspace feature layer, but no
membership/role guard for accessing an existing workspace and no financial CRUD
workflow. The local PostgreSQL startup and data-retention procedure is documented
in [local-database.md](./local-database.md). Database readiness remains separate
from the liveness health contract; deployment health checks use readiness.
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

For financial features:

- Monetary values use integer minor units and an ISO currency code, not
  JavaScript floating-point arithmetic.
- Money representation and arithmetic invariants are documented in
  [fintech-concepts.md](./fintech-concepts.md).
- Financial business rules live outside React components.
- Multi-record financial changes use database transactions.
- Workspace access control is enforced by the backend, not only hidden in the
  UI.
- Important financial operations will create audit events.

## Architectural Change Policy

Update this document when a meaningful boundary, deployment shape, or ownership
decision changes. Record significant, long-lived trade-offs as Architecture Decision
Records in `docs/adr/` when that directory is introduced.
