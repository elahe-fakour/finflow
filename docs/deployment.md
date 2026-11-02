# FinFlow Deployment Runbook

This document describes the release contract for the separate Next.js web
application, NestJS API, and managed PostgreSQL database. It is intentionally
provider-neutral until the hosting decision in Phase 14.1.

## Required production configuration

Set these values in the hosting provider's secret/environment configuration.
Do not commit them to Git or place them in a browser-exposed `NEXT_PUBLIC_*`
variable.

| Variable                          | Used by        | Production rule                                                                                                               |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | API and Prisma | Managed PostgreSQL connection string; use TLS when the provider requires it.                                                  |
| `WEB_ORIGIN`                      | API            | One absolute HTTPS origin for the deployed Next.js app; no path, query, or fragment.                                          |
| `API_BASE_URL`                    | Next.js server | Private URL of the deployed API; never expose it with `NEXT_PUBLIC_`.                                                         |
| `INVITATION_ENCRYPTION_KEY`       | API            | A randomly generated 32-byte key encoded as 64 hexadecimal characters.                                                        |
| `RESEND_API_KEY`                  | API (optional) | Required only when real invitation email delivery is enabled.                                                                 |
| `EMAIL_FROM`                      | API (optional) | A sender identity verified with the email provider.                                                                           |
| `INVITATION_DELIVERY_INTERVAL_MS` | API            | Keep `0` when delivery is handled by a separate worker; use a positive value only for a deliberate single-instance scheduler. |

The API refuses to start with a missing production `WEB_ORIGIN` or a non-HTTPS
origin. Production sessions use the secure `__Host-sid` cookie policy.

## Release order

1. Build and test the exact commit in CI.
2. Deploy the API application with production environment variables.
3. Apply committed Prisma migrations from the API release image or build:

   ```bash
   npm run prisma:migrate:deploy
   ```

   Never use `prisma db push` against production.

4. Start or roll the API and verify the public health endpoint:

   ```text
   GET https://api.example.com/api/v1/health
   ```

5. Deploy the Next.js application with its server-only `API_BASE_URL` and the
   matching `WEB_ORIGIN` on the API.
6. Run a smoke check: register or sign in with a disposable account, open the
   protected dashboard, and sign out. Do not use real financial data.

## Database safety

- Take the provider's backup before a migration that changes financial tables.
- Apply migrations forward-only and review the generated SQL before release.
- Keep production data separate from preview/staging data.
- Seed only clearly marked demo records; never copy customer or bank data into a
  portfolio environment.
- If a migration fails, stop the release, preserve the error, and investigate
  before retrying. Do not delete the migration history to make it pass.

## Health and rollback

The health endpoint is for process and dependency checks, not a replacement for
monitoring. Configure the hosting platform to restart unhealthy API instances
and alert on repeated failures. Keep the previous application image available
for rollback, but do not automatically roll back a database migration: database
changes must be designed to remain compatible with the previous application
version or have an explicit recovery plan.

## Pre-publication checklist

- [ ] Repository contains no `.env.local`, credentials, API keys, or private data.
- [ ] CI passed lint, typecheck, tests, and production builds.
- [ ] Production `WEB_ORIGIN` uses HTTPS and matches the web deployment exactly.
- [ ] Database backup and migration review are complete.
- [ ] Health check and error monitoring are configured.
- [ ] Demo data is synthetic and clearly labeled.
- [ ] A smoke login, protected-route check, and logout succeeded.
