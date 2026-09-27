# FinFlow API

The NestJS API is the future authoritative backend for FinFlow. It starts on
port `3001`, separately from the Next.js web application on port `3000`.

At this milestone the API bootstraps its Nest module graph and owns the Prisma
schema and migration configuration. Database models, runtime database access,
authentication, financial endpoints, and health checks are introduced in their
planned follow-up tasks.

From the repository root:

```bash
npm run dev:api
npm run build:api
npm run typecheck:api
npm run check:api
npm run prisma:generate
npm run prisma:validate
```

Before using any Prisma command that connects to PostgreSQL, start the local
database and configure `DATABASE_URL` in the repository root `.env.local`.
See [the local database guide](../../docs/local-database.md) for the startup and
migration workflow.

The API uses NestJS 12 and TypeScript 6 in its workspace. The web application
remains on its existing Next.js-compatible TypeScript 5 toolchain. Both share
the strict compiler conventions in `tsconfig.shared.json`.
