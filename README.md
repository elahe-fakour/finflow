# FinFlow

FinFlow is a financial operations platform for freelancers and small businesses.
It is being built as a production-minded portfolio project that combines practical
accounting workflows with modern web engineering.

> **Project status:** Phase 7 — Authentication & Authorization is in progress.
> The repository contains a frontend workflow preview, a NestJS API, local
> PostgreSQL Compose configuration, a tracked Prisma schema, and secure
> registration/login with database-backed browser sessions and protected
> application routes. Workspace guards, persisted financial API workflows, and
> audit events are still planned work.

## Product Direction

FinFlow will help business owners and accountants manage financial operations in
one workspace, including:

- Customers, vendors, and invoices
- Payments, income, and expenses
- Bank accounts and transactions
- Transaction reconciliation and audit history
- Financial reports such as Profit & Loss and Cash Flow

The complete, incremental delivery plan is available in [plan.md](./plan.md).
Repeatable manual payment-preview checks are in [docs/testing.md](./docs/testing.md).
The current database contract and financial persistence invariants are in
[docs/database.md](./docs/database.md).
The approved backend-owned session design is in
[docs/authentication.md](./docs/authentication.md).
The provider-neutral production release runbook is in
[docs/deployment.md](./docs/deployment.md).

## Current Technology

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [NestJS](https://nestjs.com/) 12 in `apps/api`
- [PostgreSQL](https://www.postgresql.org/) 18 for local development via Docker Compose
- [Prisma ORM](https://www.prisma.io/) 7 for schema, migrations, and type-safe database access
- ESLint
- [Vitest](https://vitest.dev/) for financial unit tests

## Getting Started

### Prerequisites

- Node.js `24.21.0` (the version is pinned in `.nvmrc`)
- npm
- Docker Desktop (only for the local PostgreSQL service)

Verify your Node.js version:

```bash
node --version
```

It should begin with `v24.21.0`.

### Install and run

```bash
git clone https://github.com/elahe-fakour/finflow.git
cd finflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run the local API

In a second terminal:

```bash
npm run dev:api
```

The API starts on port `3001`. Its liveness endpoint is available at
`GET /api/v1/health` and responds with `{ "status": "ok" }`. The credential
endpoints are `POST /api/v1/auth/register`, `POST /api/v1/auth/login`,
`GET /api/v1/auth/me`, and `POST /api/v1/auth/logout`. They need a healthy
local PostgreSQL service. Login creates an opaque, `HttpOnly` browser cookie;
workspace authorization is introduced separately.

The browser-facing sign-in, account creation, and sign-out routes are served by
the Next.js application. They relay only the session cookie to the API through a
same-origin BFF boundary. `API_BASE_URL` in `.env.local` defaults to
`http://localhost:3001`; do not expose it through a `NEXT_PUBLIC_` variable.

### Run local PostgreSQL

PostgreSQL is the only service currently managed by Docker. Follow the
[local database guide](./docs/local-database.md) to create `.env.local`, start
the service, and verify its health. FinFlow does not connect to it until the
first database-backed API operation runs; the liveness endpoint does not access
PostgreSQL.

### Prisma commands

After PostgreSQL is healthy and `DATABASE_URL` is configured in `.env.local`:

```bash
npm run prisma:generate
npm run prisma:validate
```

The committed migrations define workspace access, contacts, invoices, manual
income/expense entries, bank accounts, bank transactions, and reconciliation
records. Financial amounts are stored as integer minor units; the local database
guide documents how future schema changes create reviewable migrations.

## Available Commands

| Command                         | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `npm run dev`                   | Start the development server.                           |
| `npm run dev:api`               | Start the NestJS API in watch mode on port 3001.        |
| `npm run lint`                  | Run ESLint checks.                                      |
| `npm run typecheck`             | Run TypeScript checks without generating files.         |
| `npm run test`                  | Run unit tests in watch mode.                           |
| `npm run test:run`              | Run unit tests once.                                    |
| `npm run format`                | Format supported files with Prettier.                   |
| `npm run format:check`          | Verify supported files match the Prettier convention.   |
| `npm run build`                 | Create an optimized production build.                   |
| `npm run build:api`             | Build the NestJS API.                                   |
| `npm run typecheck:api`         | Type-check the NestJS API.                              |
| `npm run check:api`             | Lint, type-check, and build the NestJS API.             |
| `npm run test:api`              | Run API HTTP integration tests.                         |
| `npm run prisma:generate`       | Generate the Prisma Client from the API schema.         |
| `npm run prisma:validate`       | Validate the Prisma schema and configuration.           |
| `npm run prisma:migrate:dev`    | Create and apply a local development migration.         |
| `npm run prisma:migrate:deploy` | Apply committed migrations in a deployment.             |
| `npm run prisma:migrate:status` | Show migration status after the first migration exists. |
| `npm run check`                 | Run lint, typecheck, unit tests, and build in sequence. |
| `npm run start`                 | Start the production server after a successful build.   |

## Project Structure

```text
src/app/       # App Router routes, layouts, and global styles
apps/api/      # NestJS API workspace
compose.yaml    # Local PostgreSQL service definition
public/        # Static assets
.vscode/       # Shared VS Code workspace settings and recommendations
plan.md        # Product roadmap, architecture direction, and delivery plan
```

## Engineering Principles

- Financial correctness, consistency, traceability, and auditability come first.
- Future monetary values will use integer minor units rather than JavaScript
  floating-point numbers.
- Business and financial rules will live outside React UI components.
- Authentication is enforced by the backend; workspace authorization follows in
  the next milestone.
- Secrets and real financial data must never be committed. Use `.env.local` for
  local values and `.env.example` only for safe placeholders.

## Contributing to This Learning Project

Development follows a deliberate sequence:

```text
Phase → Milestone → Task → Learn → Implement → Test → Review → Commit
```

Each task is intentionally small, tested in proportion to its risk, and designed
to result in one focused Git commit.
