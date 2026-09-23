# FinFlow Architecture

## Status and Scope

This document describes the architecture that exists today and the boundaries that
will guide its evolution. FinFlow is currently a frontend-only Next.js application.
The NestJS API, PostgreSQL database, authentication, and financial workflows are
planned but have not been implemented.

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
```

The application is a single Next.js project. Its source lives in `src/`, with the
App Router in `src/app`:

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
- **Quality checks:** Prettier, ESLint, TypeScript, and production builds provide
  the initial feedback loop.

There is currently no API layer, database, authentication, authorization, or
financial business-logic module. The invoice types are contracts only; the UI must
not pretend that persistence or financial calculations already exist.

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
