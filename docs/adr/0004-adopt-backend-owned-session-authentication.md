# ADR 0004: Adopt Backend-Owned Opaque Session Authentication

- Status: Accepted
- Date: 2026-10-03

## Context

FinFlow has a separate Next.js web application and a NestJS API. The NestJS API
will own workspace membership checks, role-based authorization, financial
workflows, and audit events. Authentication must therefore produce an identity
that the API can verify on every protected request; hiding controls in the web
application is not an authorization boundary.

FinFlow's initial clients are browser-based. It needs sign-out, session
revocation, session rotation after sensitive changes, and a design that keeps
password hashes and session secrets out of browser JavaScript. These needs make
short-lived bearer JWTs stored in browser storage a poor default for the MVP.

## Decision

Adopt the official `@nestjs/authentication` package with database-backed opaque
sessions, implemented by the NestJS API.

The browser will receive an opaque, random session token only in an HTTP cookie.
PostgreSQL will store a one-way SHA-256 verifier of that token together with its
user ID, expiry, activity timestamps, and minimal session metadata. The API will
resolve the cookie to a user for every protected request. A session identifies a
user only; it never grants a workspace role. Workspace membership and role checks
remain backend authorization concerns in Phase 7, Milestone 7.2.

The planned cookie policy is:

- production cookie name: `__Host-sid`;
- `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`;
- no cookie `Domain` attribute, so the `__Host-` prefix remains valid;
- a development-only localhost configuration that preserves secure production
  defaults;
- explicit trusted origins and credentialed CORS for the separate web and API
  origins.

The NestJS authentication module's built-in `PasswordHasher` will hash passwords
with Node's memory-hard `scrypt` implementation. Passwords are never stored,
logged, returned from a repository, or sent to the web application after a
request. Registration will accept passphrases from 15 to 128 characters without
composition rules or silent truncation.

The first implementation will create a new session at sign-in, rotate sessions
after privilege or password changes, and support logout by revoking the stored
session. Authentication failures will use generic responses to avoid revealing
whether an email address is registered. Email verification, password recovery,
MFA, social sign-in, mobile bearer tokens, and API keys are intentionally out of
scope for the first authentication slice.

## Consequences

- The next authentication task will install `@nestjs/authentication`; no auth
  package is added by this decision-only task.
- A Prisma migration will add private credential data and a session store. The
  existing `User` model stays the public identity record; password hashes must
  not leave the authentication repository.
- Nest's authentication and CSRF protections will run before workspace
  authorization guards. The Next.js application will use `credentials: "include"`
  for API requests after CORS and trusted origins are configured.
- The session store makes individual logout, logout everywhere, expiry, and
  revocation possible without a JWT deny-list.
- The NestJS module's database store contract must be implemented with atomic
  conditional writes where required. Production must not use in-memory session
  storage.
- Password hashing costs will be benchmarked on the deployment environment before
  production values are finalized; memory-hard hashes require capacity planning.

## Alternatives Considered

- **Auth.js in the Next.js application:** useful for a Next-only application,
  but it would create a second authentication boundary while NestJS still needs
  to authenticate and authorize every financial API request.
- **Self-built NestJS sessions:** would provide control, but duplicates the
  session rotation, CSRF, storage, and credential-handling work already supplied
  by the official NestJS module.
- **Passport with JWT access and refresh tokens:** appropriate for mobile or
  third-party API clients, but adds refresh-token rotation and revocation
  complexity that opaque browser sessions avoid. Token support can be added later
  for a separate client type.
- **Managed identity provider:** can be appropriate for a commercial deployment,
  but adds vendor configuration and cost before the product's identity
  requirements are proven. It would also reduce the backend-authentication
  learning goal of this portfolio project.

## References

- [NestJS authentication documentation](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
