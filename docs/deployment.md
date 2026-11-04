# FinFlow Deployment Runbook

This document describes the release contract for the separate Next.js web
application, NestJS API, and managed PostgreSQL database. The initial hosting
target is Render, as recorded in
[ADR 0006](./adr/0006-select-hosting-platform.md); the environment-variable and
migration contracts remain portable across providers.

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
2. Confirm the Render API service has production environment variables and points
   `DATABASE_URL` at the production database in the same region. Keep the
   database's public network access disabled.
3. For a schema-changing release, create a logical database export before
   deployment and confirm the database's point-in-time recovery window is
   available. Do this before every production migration that changes financial
   data.
4. Configure the API service's Render **Pre-Deploy Command** as:

   ```bash
   npm run prisma:migrate:deploy
   ```

   Configure it only on the API service. Render runs this command after the
   build and before the new API instance is deployed; the new deployment fails
   if the command fails. The existing instance may still be serving requests
   while the migration runs, so every migration must remain compatible with the
   currently deployed API. The pre-deploy command is available on paid web
   services; use a paid API service for this production release path.

   Build the API service from the repository root with:

   ```bash
   npm ci && npm run prisma:generate && npm run build:api
   ```

   Keep `apps/api/prisma/migrations/` and `apps/api/prisma/schema.prisma`
   together in the deployed commit. `migrate deploy` applies committed pending
   migrations; it does not generate Prisma Client. Never use `prisma db push`
   or `prisma migrate dev` against production.

5. Review the API deploy logs. Confirm that the migration completed and the API
   deployment became healthy. If a migration fails, stop the release and inspect
   the migration logs and `_prisma_migrations` state before taking any action.
   Do not edit or delete an applied migration to force a retry.

6. From the paid API service's shell, verify the migration status against the
   production database:

   ```bash
   npm run prisma:migrate:status
   ```

7. Verify both public API health endpoints:

   ```text
   GET https://api.example.com/api/v1/health
   GET https://api.example.com/api/v1/ready
   ```

8. Deploy the Next.js application with its server-only `API_BASE_URL` and the
   matching `WEB_ORIGIN` on the API.
9. Run a smoke check: register or sign in with a disposable account, open the
   protected dashboard, and sign out. Do not use real financial data.

Render runs pre-deploy commands on a separate temporary instance, after the
build and before the new service version starts. They are intended for migrations
and are supported on paid web services. See Render's
[deploy sequence](https://render.com/docs/deploys).

## Staging environment

The staging Render Blueprint is defined in [`render.yaml`](../render.yaml). It
creates a separate `staging` environment with its own web service, API service,
and private PostgreSQL database. It tracks the Blueprint's linked branch and
deploys only after the GitHub checks pass.

To provision it:

1. Confirm the Render account can use the Frankfurt region and review the
   current service and workspace charges. The Blueprint sets the web service
   and PostgreSQL to free plans; the API uses a paid `0.5c-512mb` plan so its
   migration pre-deploy command is available.
2. In Render, select **New > Blueprint**, connect this repository, select the
   reviewed branch, and use the root `render.yaml`. Review the proposed
   resources before deploying the Blueprint.
3. When prompted, provide `INVITATION_ENCRYPTION_KEY` generated with
   `openssl rand -hex 32`. Keep it in Render's secret configuration only.
4. Confirm the API environment received its own staging `DATABASE_URL` and the
   web/API origin values reference the staging services. Do not copy production
   secrets or database data into this environment.
5. After Render reports both services healthy, verify
   `https://<staging-api-host>/api/v1/health` and
   `https://<staging-api-host>/api/v1/ready`, then smoke-test registration,
   sign-in, protected dashboard access, and sign-out with a disposable account.

This shared staging environment is for synthetic data. Its free PostgreSQL
database expires after 30 days and has no backups, and the free web service can
sleep when idle. Do not use it for production or real financial data. The paid
API service is the only planned recurring staging compute charge; confirm its
current rate before provisioning. Per-pull-request Render preview environments
require a Pro workspace and incur additional resource charges, so they are not
enabled by this Blueprint.

## Database safety

- Create a logical export before a production migration that changes financial
  tables, and confirm point-in-time recovery is enabled. Render's recovery window
  depends on the workspace plan; review it in the dashboard before release.
- Apply migrations forward-only and review the generated SQL before release.
- Prefer expand-and-contract changes: add new schema first, deploy code that can
  work with both old and new shapes, migrate/backfill data, then remove obsolete
  schema in a later release after the old code is gone.
- Keep production data separate from preview/staging data.
- Seed only clearly marked demo records; never copy customer or bank data into a
  portfolio environment.
- If a migration fails, stop the release, preserve the error, and investigate
  before retrying. A failed pre-deploy command cancels the new Render release,
  but does not reverse database work that already completed. Do not delete the
  migration history to make it pass.

## Health and rollback

### Health, logs, and incident response

`GET /api/v1/health` is liveness: it confirms the API process can answer HTTP
without touching PostgreSQL. `GET /api/v1/ready` checks PostgreSQL and returns
`503 SERVICE_NOT_READY` when the API cannot serve database-backed requests. The
Render API service uses `/api/v1/ready` as its health check path. Keep both
endpoints public so the host does not need session credentials.

The API exception filter writes structured JSON records for unexpected `5xx`
responses, including method, path without query parameters, error type, and
stack frames. Next.js server request failures are also written as structured
JSON. Neither logger includes request bodies, headers, exception messages, or
query strings. These events go to the hosting provider's application logs; no
external error service or DSN is configured by this change.

For each production environment, retain access to API and web application logs,
review them after a deployment, and configure provider notifications for failed
deploys or sustained health-check failures. Add an external uptime probe for
`/api/v1/ready` and alert on consecutive failures. During an incident, check
service health and recent deploys first, then inspect API/web logs and database
availability. Do not paste secrets or customer data into incident notes.

Keep the previous application image available for rollback, but do not
automatically roll back a database migration: database changes must be designed
to remain compatible with the previous application version or have an explicit
recovery plan.

Render paid Postgres plans support point-in-time recovery; the available window
depends on the workspace plan. A restore creates a separate database instance.
Validate that instance before changing `DATABASE_URL` to point production at it.
See [Render's recovery guide](https://render.com/docs/postgresql-backups).

## Pre-publication checklist

- [ ] Repository contains no `.env.local`, credentials, API keys, or private data.
- [ ] CI passed lint, typecheck, tests, and production builds.
- [ ] Production `WEB_ORIGIN` uses HTTPS and matches the web deployment exactly.
- [ ] Database backup and migration review are complete.
- [ ] The API readiness check, hosting notifications, and uptime probe are configured.
- [ ] Operators can access the web and API application logs.
- [ ] Demo data is synthetic and clearly labeled.
- [ ] A smoke login, protected-route check, and logout succeeded.
