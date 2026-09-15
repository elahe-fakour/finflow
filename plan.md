# FinFlow Development Plan

## 1. Product Overview

FinFlow is a financial operations platform for freelancers and small businesses.
It will bring invoicing, customers, vendors, income and expenses, bank activity,
reconciliation, and financial reporting into one workspace. The product is both a
credible portfolio project and a learning vehicle for production-oriented React,
Next.js, backend, and database engineering.

The product will be desktop-first and responsive. It will favor clear financial
information, accessible controls, traceable changes, and predictable behavior over
visual novelty.

## 2. MVP Scope

The MVP development experience begins focused on a single workspace, while the
architecture is workspace-aware from the beginning. It includes authentication and
multi-user workspace membership with Owner, Admin, Accountant, and Member roles,
alongside a polished UI and persistent backend data. It will support customers,
vendors, invoices, manual income and expenses, bank accounts, manually entered bank
transactions, basic reports, and simple reconciliation suggestions.

MVP acceptance criteria:

- A signed-in user can work in a workspace they own or belong to.
- Owner, Admin, Accountant, and Member access is enforced by backend workspace
  authorization.
- Users can manage customers, vendors, invoices, and manual payments.
- Invoice totals and balances are calculated safely using minor currency units, not
  JavaScript floating-point values.
- Users can record income and expenses and see them in reports.
- Users can manage bank accounts and transactions, then confirm a suggested or
  manual invoice-payment reconciliation.
- Important financial changes have an audit trail.
- Core business rules have automated tests and the deployed application is usable.

## 3. Features Intentionally Excluded from the MVP

These are valuable, but are deferred to preserve focus and avoid premature
complexity:

- Multi-currency conversion and exchange-rate management
- Tax filing, tax jurisdiction rules, and tax-engine integrations
- Double-entry general ledger and full accounting close workflows
- Real bank-provider integrations and automatic transaction sync
- OCR receipt extraction and rich attachment storage
- Email delivery of invoices and payment-provider integrations
- Advanced approval workflows and granular custom permissions
- Forecasting beyond an explicitly simple post-MVP model
- CSV import/export beyond a deliberately scoped later import flow
- Mobile-native applications, localization, and multi-region compliance

## 4. Technology Strategy

Start with a TypeScript Next.js application and introduce dependencies only when a
concrete task needs them. The initial frontend will use Next.js App Router, React,
Tailwind CSS, ESLint, and the built-in TypeScript tooling. Use Server Components for
data-oriented page shells and Client Components only for interactivity.

The API and database will be introduced once the frontend information architecture
is proven. NestJS will own business rules and authorization; PostgreSQL will store
durable financial data; Prisma will provide schema migrations and typed data access.
This deliberately creates a real frontend/backend boundary without paying that
complexity during the visual foundation work.

Planned additions, introduced at their first genuine need:

| Tool | Purpose in FinFlow | When introduced |
| --- | --- | --- |
| shadcn/ui | Accessible, composable primitives with source ownership | Design-system component milestone |
| React Hook Form + Zod | Reliable, typed form state and validation | First create/edit form |
| TanStack Query | Client cache and mutation states for richer data screens | When client-side server-state interactions justify it |
| NestJS | Modular API, validation, authorization, business services | Backend foundation |
| PostgreSQL + Prisma | Relational integrity, migrations, typed persistence | Backend foundation |
| Vitest | Fast unit/integration tests for money and business logic | First financial calculation |
| Playwright | End-to-end coverage of critical user journeys | First complete vertical slice |
| Docker | Reproducible local PostgreSQL and later services | Database setup |
| GitHub Actions | Continuous quality checks | When lint/typecheck/tests exist |

### Money representation decision

FinFlow will not use JavaScript `number` values for persisted monetary amounts or
financial arithmetic. `0.1 + 0.2` demonstrates why: binary floating point cannot
represent many decimal values exactly. For the MVP, monetary amounts will be stored
and calculated as integer minor units (for example, `1250` cents means `$12.50`),
with an ISO currency code alongside them. Formatting will happen only at the UI
boundary. A decimal library or database decimal type will be evaluated only if a
later requirement needs fractional minor units, currency conversion, or calculations
that cannot safely use integers.

## 5. High-Level Architecture

```text
Browser
  └─ Next.js web application
       ├─ Server-rendered pages and layout
       ├─ Client UI for tables, forms, and interactions
       └─ Typed API client
             │
             ▼
          NestJS API
       ├─ Auth / authorization guards
       ├─ Feature modules and business services
       ├─ Validation and error mapping
       └─ Audit-event creation within financial workflows
             │
             ▼
       PostgreSQL (via Prisma)
       ├─ Workspace-scoped relational data
       ├─ Constraints and indexes
       └─ Transactional financial updates
```

Key boundaries:

- React components present data and collect input; they never own financial rules.
- The NestJS service layer owns invoice status, balance, reconciliation, and audit
  behavior.
- PostgreSQL constraints protect data integrity even if an API bug exists.
- Any multi-record financial operation (for example, recording a payment and
  updating an invoice balance) runs within a database transaction so it either
  completes fully or rolls back fully.
- Every tenant-owned record is scoped by `workspaceId`; authorization is enforced by
  the API, never merely hidden by the UI.

## 6. Development Phases, Milestones, and Tasks

Each numbered task is intentionally sized as one reviewable Git commit. A task is
completed only after learning notes, manual test instructions, and proportionate
automated checks have been provided.

### Phase 1 — Project Foundation

Learning goal: Understand a modern Next.js project, project conventions, and the
purpose of a tight feedback loop.

**Milestone 1.1: Repository and application initialization**

1. Initialize Git and scaffold the Next.js TypeScript/Tailwind application.
2. Establish repository hygiene (`.gitignore`, editor settings, Node version, and
   environment-variable example policy).
3. Add a concise README with project purpose, local setup, and current status.
4. Configure baseline lint, typecheck, and production build scripts.

**Milestone 1.2: Engineering conventions**

1. Add formatting conventions and a format-check script.
2. Add a small contribution guide covering branch, commit, and review practices.
3. Add the first architecture document describing the frontend-only starting point.

### Phase 2 — Application Shell & Design System

Learning goal: Learn component composition, responsive layout, accessibility, and
Server/Client Component boundaries.

**Milestone 2.1: Visual foundations**

1. Define semantic design tokens for color, typography, spacing, radii, and focus.
2. Add the icon strategy and shared utility for conditional class names.
3. Introduce and configure shadcn/ui only when the first reusable primitive needs
   it; document the ownership tradeoff.
4. Create shared Button, Card, Input, Badge, and Empty State components.

**Milestone 2.2: Authenticated application shell**

1. Build the desktop sidebar with grouped navigation and active state.
2. Build a responsive mobile navigation pattern.
3. Build the top bar with search affordance, notifications, workspace selector, and
   profile menu placeholders.
4. Compose the authenticated layout and page container.
5. Add accessible navigation behavior (keyboard focus, labels, and reduced motion).

**Milestone 2.3: UI states**

1. Add reusable loading/skeleton patterns.
2. Add reusable empty, error, and not-found states.
3. Review shell responsiveness at desktop, tablet, and mobile widths.

### Phase 3 — Dashboard

Learning goal: Translate product requirements into reusable display components and
clear information hierarchy.

**Milestone 3.1: Dashboard presentation**

1. Create the dashboard route and page header.
2. Add KPI card components for income, expenses, receivables, and cash balance.
3. Add a cash-flow chart using explicitly labeled static sample data.
4. Add expense-breakdown visualization with an accessible text alternative.
5. Add recent invoices and quick actions panels.
6. Add recent activity, bank accounts, and profit/loss summary panels.

**Milestone 3.2: Dashboard quality**

1. Add dashboard loading and empty states.
2. Perform a responsive and accessibility review of dashboard UI.
3. Refine realistic sample data and remove misleading placeholder claims.

### Phase 4 — Customers & Vendors

Learning goal: Build usable CRUD interfaces, accessible forms, and client-side
validation before connecting a backend.

**Milestone 4.1: Customer experience**

1. Create the customer list route with static data, search, and empty state.
2. Create customer detail layout with invoice and payment placeholders.
3. Introduce React Hook Form and Zod for the customer form; document why.
4. Add the customer create form UI and validation feedback.
5. Add the customer edit form UI and unsaved-change behavior.

**Milestone 4.2: Vendor experience**

1. Create the vendor list route with static data and filters.
2. Create vendor detail layout with expenses and payable summary placeholders.
3. Add vendor create/edit form UI with shared validation patterns.

### Phase 5 — Invoices

Learning goal: Model invoice behavior, safely calculate money, and test pure
business logic before persisting it.

**Milestone 5.1: Invoice UI and domain types**

1. Define frontend invoice, line-item, payment, and status domain types.
2. Create invoice list with status filters and accessible status badges.
3. Create invoice detail page with totals and payment history presentation.
4. Create invoice editor shell with customer, dates, currency, and notes fields.

**Milestone 5.2: Financial calculation rules**

1. Define and document the minor-unit money utility contract.
2. Implement pure line-item subtotal, discount, tax, and invoice-total functions.
3. Add Vitest and unit tests for money and invoice calculations.
4. Add editable invoice line items using the tested calculation module.
5. Implement invoice balance and status derivation rules for draft, sent, paid,
   overdue, and cancelled states.
6. Add unit tests for partial-payment and status edge cases.

**Milestone 5.3: Payments UI**

1. Add a record-payment form with validation that prevents overpayment.
2. Add payment confirmation and updated invoice detail presentation.
3. Add manual tests covering partial and full payment behavior.

### Phase 6 — Backend Foundation

Learning goal: Understand API layering, relational data modeling, migrations, and
transactional persistence.

**Milestone 6.1: Local API and database**

1. Add a NestJS API application alongside the web app with shared TypeScript
   conventions.
2. Add Docker Compose for local PostgreSQL only, including a documented startup
   path; do not containerize everything prematurely.
3. Add Prisma, establish migration workflow, and configure local environment files.
4. Add a health endpoint and integration smoke test.

**Milestone 6.2: Core schema**

1. Model users, workspaces, and memberships with role enum and indexes.
2. Model customers and vendors with workspace-scoped uniqueness constraints.
3. Model invoices, invoice line items, and payments with integer minor-unit amounts.
4. Model income/expenses, bank accounts, bank transactions, and reconciliation
   records.
5. Document the schema, invariants, and the money storage decision in `docs/`.

**Milestone 6.3: API conventions**

1. Add request validation, a consistent error response, and API versioning policy.
2. Add workspace-scoped repository/service patterns.
3. Add database transaction helper conventions for multi-record workflows.

### Phase 7 — Authentication & Authorization

Learning goal: Apply secure identity, session management, and backend-enforced RBAC.

**Milestone 7.1: Authentication**

1. Select and document the auth approach based on the backend boundary.
2. Implement registration and login with secure password handling.
3. Implement authenticated session/token handling with logout.
4. Protect application routes and add unauthenticated UI states.

**Milestone 7.2: Workspace authorization**

1. Add workspace creation and owner membership creation.
2. Add API guards that verify membership and workspace scope.
3. Implement Owner, Admin, Accountant, and Member permissions in the backend.
4. Add authorization tests proving a user cannot access another workspace's data.

### Phase 8 — Income & Expenses

Learning goal: Deliver a complete feature slice from database to UI, including
validation, authorization, and error states.

**Milestone 8.1: Categories and API**

1. Add workspace-scoped income and expense categories.
2. Implement category CRUD API with validation and authorization.
3. Implement income/expense CRUD API with pagination and date filters.

**Milestone 8.2: Income & expense UI**

1. Connect category management UI to the API.
2. Connect income/expense list UI with filters and paging.
3. Add create income flow.
4. Add create expense flow with vendor selection.
5. Add edit/delete flows with confirmation, error, and empty states.

### Phase 9 — Bank Accounts & Transactions

Learning goal: Design reliable financial-record workflows and distinguish bank
transaction data from accounting records.

**Milestone 9.1: Bank accounts**

1. Implement bank-account API with workspace authorization.
2. Add bank-account list and balance UI.
3. Add create/edit bank-account form.

**Milestone 9.2: Transactions**

1. Implement manual bank-transaction API with idempotency-aware creation rules.
2. Build bank transaction list with search, filters, and pagination.
3. Build transaction detail view and category assignment.
4. Add transaction import design document before implementing CSV import.
5. Implement a scoped CSV import flow with preview and row-level errors.

### Phase 10 — Reconciliation

Learning goal: Build explainable matching logic, protect financial consistency, and
record an auditable workflow.

**Milestone 10.1: Reconciliation domain**

1. Document reconciliation invariants, state transitions, and cancellation rules.
2. Define deterministic invoice-match candidate scoring inputs.
3. Implement and unit-test a pure candidate scoring module.

**Milestone 10.2: Reconciliation workflow**

1. Implement API to retrieve suggestions for an eligible bank transaction.
2. Build suggestion review UI with confidence explanation.
3. Implement confirm reconciliation in one database transaction: create/associate
   payment, update invoice, mark transaction reconciled, and write audit event.
4. Implement manual match and unreconcile flows with authorization.
5. Add integration and end-to-end tests for core reconciliation paths.

### Phase 11 — Financial Reports

Learning goal: Build correctly scoped aggregate queries and present financial data
without confusing cash and accrual concepts.

**Milestone 11.1: Report queries**

1. Define report date-range and cash/accrual assumptions in documentation.
2. Implement Profit & Loss report query and tests.
3. Implement cash-flow report query and tests.
4. Implement accounts-receivable and accounts-payable report queries and tests.
5. Implement expense and revenue breakdown report queries and tests.

**Milestone 11.2: Report UI**

1. Add shared report date-range controls.
2. Build Profit & Loss and Cash Flow report pages.
3. Build receivables/payables report pages.
4. Build revenue/expense breakdown pages with accessible visualizations.
5. Add printable/export-ready report layout; defer actual export if not justified.

### Phase 12 — Audit Log & Security

Learning goal: Make sensitive operations traceable and improve the application's
defense in depth.

**Milestone 12.1: Audit events**

1. Finalize audit-event schema and retention/redaction policy.
2. Add audit-event writing to invoice and payment workflows.
3. Add audit-event writing to income/expense and reconciliation workflows.
4. Build a workspace audit-log API with pagination and filters.
5. Build audit-log UI with safe metadata presentation.

**Milestone 12.2: Security hardening**

1. Review authorization coverage for every workspace-owned endpoint.
2. Add rate-limit and security-header strategy appropriate to deployment.
3. Add structured logging and safe error reporting policy.
4. Document secrets management and data-handling boundaries.

### Phase 13 — Testing

Learning goal: Apply the test pyramid and use tests to protect business behavior,
not implementation details.

**Milestone 13.1: Test foundations**

1. Standardize test scripts and test-data factories.
2. Add API integration test database isolation strategy.
3. Add Playwright configuration and a smoke test.

**Milestone 13.2: Critical-path coverage**

1. Add invoice/payment integration tests.
2. Add workspace-isolation and RBAC integration tests.
3. Add bank transaction import tests.
4. Add reconciliation end-to-end tests.
5. Add report calculation regression tests.

### Phase 14 — Production & Deployment

Learning goal: Make a service reproducible, observable, and safe to release.

**Milestone 14.1: Delivery pipeline**

1. Add GitHub Actions for lint, typecheck, unit tests, and build.
2. Add dependency update and security scanning policy.
3. Document environment variables and deployment configuration.

**Milestone 14.2: Deployable application**

1. Select hosting and managed PostgreSQL options based on current requirements.
2. Add production database migration procedure.
3. Deploy a preview/staging environment.
4. Add health checks, error monitoring, and basic operational runbook.
5. Deploy production portfolio instance with safe demo data.

### Phase 15 — Advanced FinTech Features

Learning goal: Extend a stable core using explicitly stated assumptions and measured
complexity.

**Milestone 15.1: Cash-flow forecasting**

1. Write forecasting assumptions and limitations.
2. Implement a simple deterministic 30-day forecast service.
3. Add forecast UI with scenario explanation.
4. Add tests for forecast inputs and edge cases.

**Milestone 15.2: Future integrations**

1. Evaluate bank-feed provider architecture and security requirements.
2. Evaluate payment-provider integration and webhook handling.
3. Evaluate multi-currency and a potential double-entry ledger expansion using ADRs.

## 7. Portfolio / LinkedIn Checkpoints

Create a checkpoint only when a milestone communicates substantive engineering work:

1. **Architecture foundation** — after the initial architecture/README and
   conventions are credible. Show repository structure and technical decisions.
2. **Polished app shell and dashboard** — show desktop and responsive screenshots;
   optionally record a brief navigation demo.
3. **Invoice and money model** — show invoice editor/detail and the minor-unit
   calculation tests; discuss financial precision and tested domain logic.
4. **Database and API architecture** — show an ER diagram, module boundaries, and
   migration workflow—never secrets or production data.
5. **Authentication and RBAC** — show a role/workspace diagram and protected UI;
   discuss backend authorization tests.
6. **Reconciliation engine** — show suggestion scoring explanation and a short
   confirm flow recording; discuss transactions and auditability.
7. **Financial reports** — show filtered reports and explain cash versus accrual
   assumptions.
8. **Testing and deployment** — show CI checks, test categories, and the deployed
   product with non-sensitive demo data.

At each listed point, explicitly mark `PORTFOLIO CHECKPOINT REACHED` and discuss
why it matters, suitable screenshots/recording, safe code to show, and personal
learning worth sharing before drafting any social post.

## 8. Testing Strategy

Use a layered strategy:

- **Static checks:** TypeScript, ESLint, formatting, and production builds run
  locally and in CI.
- **Unit tests:** money helpers, invoice totals, status transitions, match scoring,
  and report calculations. These must be fast and deterministic.
- **Integration tests:** NestJS endpoints, Prisma constraints, authorization, and
  database transactions against an isolated test database.
- **End-to-end tests:** critical browser journeys such as login, creating an invoice,
  recording payment, and reconciling a transaction.
- **Manual testing:** responsive layouts, keyboard navigation, screen-reader labels,
  empty/loading/error states, and financial edge cases.

The required checks grow with the codebase. Early UI tasks need lint, typecheck, and
build. Financial and API tasks must also add relevant tests. A passing check never
substitutes for reviewing business assumptions.

## 9. Deployment Strategy

Development begins locally, with PostgreSQL started through a narrowly scoped Docker
Compose service once the API exists. The web app and API may deploy independently to
managed hosting, with a managed PostgreSQL provider. This separation reflects the
architecture while avoiding self-managed production infrastructure.

Before public deployment, define production environment variables, apply migrations
through a documented release step, add health checks and error monitoring, seed only
clearly marked demo data, and ensure no credentials or private financial data enter
the repository. A staging/preview environment should validate changes before the
portfolio instance is updated.

## 10. Definition of Done for Every Task

A task is done when all applicable items are true:

- It delivers only the agreed, single task; unrelated changes are excluded.
- The implementation follows the chosen architecture and has clear names/types.
- New dependencies have a documented reason, alternatives, and intended FinFlow use.
- UI is responsive and accessible where applicable, including loading, error, and
  empty states when the task introduces data display or mutation.
- Financial changes preserve minor-unit money rules, validation, transactional
  behavior, and auditability as appropriate.
- Relevant lint, typecheck, tests, and build checks pass; failures are investigated.
- The task is explained: goal, concepts, why, what changed, important code,
  learning, common mistakes, manual test steps, and a mini challenge when useful.
- The work is small and cohesive enough for one meaningful suggested Git commit.
- The user has reviewed it; Codex does not commit automatically or continue to the
  next task without explicit instruction.

## 11. Proposed Initialization Strategy (Not Yet Performed)

When you approve the roadmap, Task 1 will initialize a Git repository and scaffold
one Next.js application with TypeScript, Tailwind CSS, ESLint, and App Router. Use
the current stable Next.js release selected by the official initializer. Prefer a
single application structure first (for example `src/app`, `src/components`, and
`src/lib`); convert to a monorepo only when NestJS is introduced and shared code
actually justifies it. No database, UI library, authentication package, chart
library, or test framework should be installed during initialization.
