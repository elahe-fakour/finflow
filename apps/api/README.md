# FinFlow API

The NestJS API is the future authoritative backend for FinFlow. It starts on
port `3001`, separately from the Next.js web application on port `3000`.

At this milestone the API only bootstraps its Nest module graph. PostgreSQL,
Prisma, authentication, financial endpoints, and health checks are introduced
in their planned follow-up tasks.

From the repository root:

```bash
npm run dev:api
npm run build:api
npm run typecheck:api
npm run check:api
```

The API uses NestJS 12 and TypeScript 6 in its workspace. The web application
remains on its existing Next.js-compatible TypeScript 5 toolchain. Both share
the strict compiler conventions in `tsconfig.shared.json`.
