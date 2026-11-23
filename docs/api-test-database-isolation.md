# API Integration Test Database Isolation

## Current State

API tests are configured separately in `apps/api/vitest.config.ts`. Most service
and repository tests use mocked dependencies. The current HTTP end-to-end specs
exercise the Nest application pipeline without provisioning a dedicated
PostgreSQL database. FinFlow does not yet automatically connect API tests to a
test database.

`PrismaService` creates its Prisma client lazily from `DATABASE_URL`. The Prisma
CLI also reads the repository's `.env.local`, so running migration commands
without first setting an explicit test URL can target the developer's local
database. Do not point test setup at the normal development or production
database.

## Isolation Decision

When a database-backed API integration test is introduced, each test run must
use a disposable PostgreSQL database dedicated to that run. In CI, start an
ephemeral PostgreSQL service for the job and discard it after the job finishes.
For local integration work, provision a separate database such as
`finflow_api_test_<run-id>`; never reuse the database configured in the usual
`.env.local` workflow.

Configure `DATABASE_URL` to the disposable database before importing `AppModule`
or constructing `PrismaService`. Prepare its schema with the committed Prisma
migrations using `prisma migrate deploy`; do not use `prisma db push` or run
development migrations against the test database. A test runner must fail
closed when the test URL is missing or does not identify the explicitly
designated test database.

Use one isolated database per test process. Database-backed specs sharing that
database must run serially unless each worker receives a separate disposable
database and URL. Unit tests with mocked persistence may continue to run in
parallel. This prevents concurrent specs and repeated fixture IDs from
interfering with one another.

## Lifecycle and Safety Rules

1. Provision the disposable database and set its URL in the test process before
   loading API modules.
2. Apply committed migrations to that database.
3. Start the Nest application and run database-backed specs against it.
4. Close the Nest application and disconnect Prisma clients in teardown.
5. Drop the disposable database or discard the CI service, including after a
   failed run.

Never reset or truncate a database solely because the test runner is starting.
Dropping a database is allowed only after setup has verified its explicit test
name and connection target. No test helper may fall back to the ordinary
`.env.local` database URL. Until automated provisioning and the fail-closed URL
check exist, keep API tests database-mocked and do not run database-backed tests
against a developer database.

## Follow-up Before Database-backed Specs

- Add a test setup entry point that validates `FINFLOW_TEST_DATABASE_URL` and
  assigns it to `DATABASE_URL` before any API module import.
- Add disposable database provisioning and migration setup for local and CI
  runs.
- Configure database-backed specs to run serially per database, or create a
  distinct database per worker.
- Verify cleanup and failure behavior before adding tests that write to
  PostgreSQL.
