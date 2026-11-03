# ADR 0006: Select the initial hosting platform

- **Status:** Accepted for the portfolio deployment
- **Date:** 2026-11-03

## Context

FinFlow has three independently deployable parts: a Next.js 16 application that
uses server-side BFF routes, a NestJS API, and PostgreSQL managed through Prisma.
The deployment must support long-running Node.js services, server-only
`API_BASE_URL`, HTTPS origins for secure session cookies, private service-to-
service traffic, Prisma migrations, health checks, and durable database backups.
The initial public instance is a portfolio deployment with synthetic demo data;
it is not approved for real customer or financial data.

## Options considered

| Option | Fit for this architecture | Trade-offs |
| --- | --- | --- |
| **Render for web, API, and PostgreSQL** | Hosts full Next.js apps as Node web services, supports separate services and managed Postgres, and provides private networking between services. | Free web services sleep after inactivity; free Postgres expires after 30 days and has no backups. Durable use requires paid resources. |
| **Railway for web, API, and PostgreSQL** | Runs all three services in one project and connects services through private environment variables. | Its standard PostgreSQL template is a single node; high availability, backups/PITR, and pooling require extra configuration. Usage-based billing needs monitoring. |
| **Vercel for web, with a separate API and database provider** | Strong fit for the Next.js application and its route handlers. | Splits operations across providers. Vercel's free Hobby plan is restricted to personal, non-commercial use, so its use depends on the project's eventual purpose and plan. |

## Decision

Use **Render** as the initial deployment platform for all three services:

- Deploy Next.js as a Node web service so its server-side BFF routes and
  authenticated pages run on the server.
- Deploy NestJS as a separate web service. Keep `API_BASE_URL` server-only and
  point it to the API through Render's private network.
- Use Render Postgres in the same region as the applications. Keep its public
  network access disabled unless an operational need requires it.
- Use paid resources for any instance expected to retain data or answer
  consistently. The free tiers are limited to temporary previews with synthetic
  data.
- Keep the API and database replaceable through the existing environment
  variables and Prisma migration contract.

This is a low-operations choice for the current single-workspace portfolio
deployment. It avoids adding a separate database vendor and keeps the public web
entry point, API, and database visibly separated. Before provisioning, verify
account availability, region choice, current plan limits, backup retention, and
the monthly quote in the provider dashboard.

## Consequences

- The deployment will use three Render services and a private API-to-database
  connection. The browser will continue to call same-origin Next.js routes.
- Production configuration remains as defined in
  [the deployment runbook](../deployment.md).
- A persistent portfolio deployment will incur provider charges. Exact cost is
  intentionally not fixed here because plan names and prices change.
- Synthetic demo data remains the only data allowed in the portfolio instance.
- Revisit this decision if the product begins handling real financial data,
  requires contractual availability/compliance, or has materially different
  region or cost requirements.

## References

- [Render: Deploy a Next.js app](https://render.com/docs/deploy-nextjs-app)
- [Render: Web services and private networking](https://render.com/docs/web-services)
- [Render: PostgreSQL](https://render.com/docs/postgresql)
- [Render: Free instance limitations](https://render.com/docs/free)
- [Railway: PostgreSQL](https://docs.railway.com/databases/postgresql)
- [Railway: Pricing](https://railway.com/pricing)
- [Vercel: Hobby plan](https://vercel.com/docs/plans/hobby)
