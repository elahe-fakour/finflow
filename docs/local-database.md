# Local PostgreSQL

FinFlow runs only PostgreSQL in Docker at this stage. The Next.js web
application and NestJS API continue to run directly on your machine. This keeps
debugging fast while providing a repeatable local database for the upcoming
Prisma and migration work.

## Prerequisite

Install and start [Docker Desktop](https://www.docker.com/products/docker-desktop/)
or another Docker Engine that includes the Compose plugin. Confirm that it is
available from the FinFlow repository root:

```bash
docker compose version
```

## First-time setup

Create a private local environment file and choose a non-placeholder password:

```bash
cp .env.example .env.local
```

`.env.local` is ignored by Git. Do not commit it or use a real production
password in it.

Start PostgreSQL and wait for its health check:

```bash
docker compose --env-file .env.local up -d postgres
docker compose --env-file .env.local ps
```

The `postgres` service should eventually show `healthy`. To inspect startup
logs, run:

```bash
docker compose --env-file .env.local logs -f postgres
```

Press `Ctrl+C` to stop following logs; this does not stop PostgreSQL.

## Verify the database

Run PostgreSQL's readiness check inside the container:

```bash
docker compose --env-file .env.local exec postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

The service listens on `localhost:5432` by default. Change `POSTGRES_PORT` in
`.env.local` if that port is already in use. Prisma and `DATABASE_URL` are
deliberately introduced in the next task, so no application currently connects
to this database.

## Stop or reset

To stop PostgreSQL while preserving its container and data:

```bash
docker compose --env-file .env.local stop postgres
```

To remove the container and network while preserving the named volume:

```bash
docker compose --env-file .env.local down
```

> **Warning:** `docker compose --env-file .env.local down -v` removes the named
> volume and permanently deletes all local PostgreSQL data. Use it only when you
> intentionally want a fresh development database.

## Design choices

- `postgres:18.6-alpine3.24` pins both PostgreSQL and its base-image variant, so
  local environments do not silently move to a new database major version.
- `finflow_postgres_data` is a named Docker volume, so the database survives
  container recreation unless it is explicitly deleted with `down -v`.
- There is no API or web container, Dockerfile, admin UI, or database seed data
  yet. Each will be added only when a later milestone has a concrete need.
