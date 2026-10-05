# FinFlow Authentication Design

## Scope and Status

The authentication slice and the first workspace-onboarding API are implemented
through Phase 7, Milestone 7.2, Task 1. The API persists password hashes,
validates registration and login input, creates revocable database-backed
sessions, and denies every endpoint unless it is explicitly public. The Next.js
application provides protected routes and same-origin sign-in, registration, and
sign-out UI.

Current public endpoints:

- `GET /api/v1/health` confirms that the API process can accept requests.
- `POST /api/v1/auth/register` creates a user and its private credential record.
- `POST /api/v1/auth/login` verifies a password, sets the session cookie, and
  returns public user data.
- `GET /api/v1/auth/me` resolves the public user from a live session.
- `POST /api/v1/auth/logout` revokes the current session and clears its cookie.

No endpoint returns a password hash, raw session token, JWT, or authorization
decision. Login responds with the same `INVALID_CREDENTIALS` error for an
unknown email address and an incorrect password.

## Boundary

```text
Browser
  │  HttpOnly session cookie; same-origin /api/auth/* requests
  ▼
Next.js web application ── server-to-server, session cookie only ──► NestJS API
                                                                      │
                                                                      ├─ authenticate session
                                                                      ├─ load user identity
                                                                      └─ verify workspace membership and role permission
                                                                               │
                                                                               ▼
                                                                         PostgreSQL
```

The NestJS API is the authentication authority. Next.js renders the experience,
relays a narrow set of authentication requests, and reads the current identity
for route rendering, but it does not decide whether a user may access financial
data. The API authenticates the session first; a later workspace guard authorizes
the authenticated user for the requested workspace.

## Initial Session Contract

| Concern            | Decision                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Browser credential | Opaque session token in an HttpOnly cookie                                                    |
| Session authority  | NestJS API using `@nestjs/authentication`                                                     |
| Browser transport  | Same-origin Next.js BFF routes that forward only the session cookie to the API                |
| Session storage    | PostgreSQL, shared by all API instances                                                       |
| Stored token value | SHA-256 verifier only; never the raw cookie token                                             |
| Token generation   | Cryptographically secure, random 256-bit token supplied by the NestJS module                  |
| Production cookie  | `__Host-sid`; `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`                                  |
| Expiry policy      | Seven-day absolute expiry and one-day idle expiry; activity is stored at most once per minute |
| Rotation           | At sign-in and after password, role, or other privilege changes                               |
| Logout             | Revoke the current stored session and clear the browser cookie                                |
| Logout everywhere  | Revoke all active sessions for the authenticated user                                         |

The raw token is not a user ID, workspace ID, role, or JWT. It is meaningless to
the browser and is never returned in JSON, included in a URL, logged, or stored
in local storage.

The `user_sessions.id` value is the SHA-256 verifier of that raw token. A login
deletes a prior valid session from the same browser before it saves the new one.
Logout deletes the stored verifier before its cookie is cleared. A conditional
database update advances `lastActiveAt` only when the session still exists and
the supplied time is later, so a concurrent logout cannot be undone by a stale
request.

## Password Contract

- Hash with the NestJS module's `PasswordHasher`, which uses Node `scrypt`.
- Require a 15-character minimum and 128-character maximum for new passwords.
- Allow Unicode, whitespace, and passphrases; do not impose arbitrary character
  composition rules or silently truncate input.
- Verify a password even when the account lookup fails, using the hasher's dummy
  verification behavior, to reduce account-enumeration timing differences.
- Return a generic invalid-credentials response for sign-in failures.
- Rehash a password after successful sign-in when configured hashing costs
  increase.

Email addresses are trimmed and stored lowercase before the unique database
constraint is checked. Password whitespace is preserved: a passphrase is not
trimmed or silently modified by FinFlow.

Password reset, email verification, breached-password checking, MFA, and
passkeys are deferred. They require separate threat modeling, delivery channels,
and tests.

## Route Protection and Browser Boundary

The NestJS `AuthenticationGuard` is global. `GET /auth/me` and every future API
endpoint require a valid session by default. The only explicit public routes are
the liveness endpoint, registration, login, and logout. Logout remains public
only so a stale browser cookie can be cleared; its service still revokes a live
session when one is present.

`src/proxy.ts` gives an unauthenticated browser an early redirect to `/login` if
the session cookie is absent. The protected `(app)` layout performs the secure
check: its Server Component forwards just `__Host-sid` to `GET /api/v1/auth/me`.
A missing, expired, or revoked session redirects to a readable sign-in state.
The proxy is an optimistic UX check, not an authorization boundary; sensitive
data and mutations remain protected by the NestJS API.

The browser does not call `localhost:3001` directly for the current MVP.
`/api/auth/register`, `/api/auth/login`, and `/api/auth/logout` are Next.js Route
Handlers on the browser's own origin. They forward the API's `Set-Cookie` header
without exposing the raw token to browser JavaScript. Every unsafe BFF request
requires an `Origin` header equal to the Next.js origin, which blocks basic
cross-origin login and logout CSRF attempts. The BFF forwards only the session
cookie, never unrelated browser cookies.

`API_BASE_URL` is server-only configuration for the Next.js-to-NestJS hop. It
must never use a `NEXT_PUBLIC_` prefix. `WEB_ORIGIN` remains the trusted origin
configuration for the NestJS session module and will be used if a future client
needs direct browser-to-API access.

Before adding financial browser mutations or a direct browser-to-API client, we
must explicitly extend CSRF protections and, if direct requests are needed,
enable credentialed CORS only for configured trusted origins. Production also
requires HTTPS; `SameSite=None` is not permitted unless a later deployment
topology requires it and the cookie remains `Secure`.

## Authorization Boundary

Authentication answers: **which user made this request?**

Authorization answers: **may that user perform this action in this workspace?**

The current `WorkspaceMembership` model remains the source for the second
answer. A session must not embed an authorization decision that can become stale.
Every workspace-owned endpoint uses backend membership and role checks in Phase
7, Milestone 7.2. `WorkspaceMembershipGuard` now verifies membership before a
controller receives `@CurrentWorkspace()` and intentionally returns a non-
disclosing 404 when membership is absent. The initial `POST /workspaces`
endpoint is the exception to that shape: it requires authentication but creates
the membership it needs in the same transaction as the new workspace. Its caller
becomes `OWNER` by construction.

Membership is authorization to enter a workspace, while a separate permission
guard authorizes the action within it. The `OWNER`, `ADMIN`, `ACCOUNTANT`, and
`MEMBER` matrix is enforced in the API from the current PostgreSQL membership
row, not from session contents. See [ADR 0005](./adr/0005-adopt-workspace-role-permissions.md).

## Next Steps

1. Add authorization tests proving cross-workspace isolation in Milestone 7.2.
2. Add a browser-facing workspace onboarding flow through the same-origin BFF.
3. Apply explicit CSRF protection to future unsafe financial workflows.
4. Add browser integration tests once the full authenticated workspace flow has
   persisted data to exercise.

## References

- [ADR 0004](./adr/0004-adopt-backend-owned-session-authentication.md)
- [NestJS authentication documentation](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
