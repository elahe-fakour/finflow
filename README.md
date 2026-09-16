# FinFlow

FinFlow is a financial operations platform for freelancers and small businesses.
It is being built as a production-minded portfolio project that combines practical
accounting workflows with modern web engineering.

> **Project status:** Phase 1 — Project Foundation is in progress. The repository
> currently contains the frontend foundation only; financial workflows and backend
> services have not been implemented yet.

## Product Direction

FinFlow will help business owners and accountants manage financial operations in
one workspace, including:

- Customers, vendors, and invoices
- Payments, income, and expenses
- Bank accounts and transactions
- Transaction reconciliation and audit history
- Financial reports such as Profit & Loss and Cash Flow

The complete, incremental delivery plan is available in [plan.md](./plan.md).

## Current Technology

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- ESLint

## Getting Started

### Prerequisites

- Node.js `24.21.0` (the version is pinned in `.nvmrc`)
- npm

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

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run lint` | Run ESLint checks. |
| `npm run typecheck` | Run TypeScript checks without generating files. |
| `npm run build` | Create an optimized production build. |
| `npm run check` | Run lint, typecheck, and build in sequence. |
| `npm run start` | Start the production server after a successful build. |

## Project Structure

```text
src/app/       # App Router routes, layouts, and global styles
public/        # Static assets
.vscode/       # Shared VS Code workspace settings and recommendations
plan.md        # Product roadmap, architecture direction, and delivery plan
```

## Engineering Principles

- Financial correctness, consistency, traceability, and auditability come first.
- Future monetary values will use integer minor units rather than JavaScript
  floating-point numbers.
- Business and financial rules will live outside React UI components.
- Authorization will be enforced by the backend when authentication is introduced.
- Secrets and real financial data must never be committed. Use `.env.local` for
  local values and `.env.example` only for safe placeholders.

## Contributing to This Learning Project

Development follows a deliberate sequence:

```text
Phase → Milestone → Task → Learn → Implement → Test → Review → Commit
```

Each task is intentionally small, tested in proportion to its risk, and designed
to result in one focused Git commit.
