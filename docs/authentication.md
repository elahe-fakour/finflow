# FinFlow Authentication Design

## Scope and Status

The credential and session slices are implemented through Phase 7, Milestone
7.1, Task 3. The API persists password hashes, validates registration and login
input, verifies credentials, and creates revocable database-backed sessions.

Current public endpoints:

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
  │  HttpOnly session cookie
  ▼
Next.js web application ── credentialed requests ──► NestJS API
                                                      │
                                                      ├─ authenticate session
                                                      ├─ load user identity
                                                      └─ later: verify workspace membership and role
                                                               │
                                                               ▼
                                                         PostgreSQL
```

The NestJS API is the authentication authority. Next.js renders the experience
and sends requests, but it does not decide whether a user may access financial
data. The API authenticates the session first; a later workspace guard authorizes
the authenticated user for the requested workspace.

## Initial Session Contract

| Concern            | Decision                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Browser credential | Opaque session token in an HttpOnly cookie                                                    |
| Session authority  | NestJS API using `@nestjs/authentication`                                                     |
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

## Browser and CSRF Contract

The API and web application use separate local origins during development. The
session module now refuses a cross-origin login or logout unless its origin is
listed in `WEB_ORIGIN` (default: `http://localhost:3000` outside production).

Before the web application makes credentialed browser requests, the API must
still:

- enable credentialed CORS only for configured trusted web origins;
- configure the same trusted origins for NestJS session handling and CSRF
  protection;
- enable NestJS CSRF protection for unsafe HTTP methods;
- use HTTPS and secure cookies in production;
- never use `SameSite=None` unless a later deployment topology requires it and
  the cookie remains `Secure`.

## Authorization Boundary

Authentication answers: **which user made this request?**

Authorization answers: **may that user perform this action in this workspace?**

The current `WorkspaceMembership` model remains the source for the second
answer. A session must not embed an authorization decision that can become stale.
Every workspace-owned endpoint will perform backend membership and role checks in
Phase 7, Milestone 7.2.

## Planned Implementation Sequence

1. Add credentialed CORS, Nest CSRF protection, and browser integration tests.
2. Add backend authentication guards and unauthenticated web UI states.
3. Add workspace membership and role guards in Milestone 7.2.

## References

- [ADR 0004](./adr/0004-adopt-backend-owned-session-authentication.md)
- [NestJS authentication documentation](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
