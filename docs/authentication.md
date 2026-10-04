# FinFlow Authentication Design

## Scope and Status

The credential slice is implemented in Phase 7, Milestone 7.1, Task 2. The API
now persists password hashes, validates registration and login input, and
verifies credentials. It deliberately does **not** issue a browser session yet;
cookie sessions, logout, and the authenticated-user context are Task 3.

Current public endpoints:

- `POST /api/v1/auth/register` creates a user and its private credential record.
- `POST /api/v1/auth/login` verifies a password and returns public user data.

Neither endpoint returns a password hash, session token, JWT, or authorization
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

| Concern            | Decision                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Browser credential | Opaque session token in an HttpOnly cookie                                                              |
| Session authority  | NestJS API using `@nestjs/authentication`                                                               |
| Session storage    | PostgreSQL, shared by all API instances                                                                 |
| Stored token value | SHA-256 verifier only; never the raw cookie token                                                       |
| Token generation   | Cryptographically secure, random 256-bit token supplied by the NestJS module                            |
| Production cookie  | `__Host-sid`; `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`                                            |
| Expiry policy      | Absolute and idle expiry configured in the session store; exact durations are set during implementation |
| Rotation           | At sign-in and after password, role, or other privilege changes                                         |
| Logout             | Revoke the current stored session and clear the browser cookie                                          |
| Logout everywhere  | Revoke all active sessions for the authenticated user                                                   |

The raw token is not a user ID, workspace ID, role, or JWT. It is meaningless to
the browser and is never returned in JSON, included in a URL, logged, or stored
in local storage.

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

The API and web application use separate local origins during development. When
authentication is implemented, the API will:

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

1. Add the session persistence model and PostgreSQL session store.
2. Implement session issuance, rotation, logout, and the current-user API
   context.
3. Add CORS, trusted-origin, CSRF, expiry, and authentication integration tests.
4. Add workspace membership and role guards in Milestone 7.2.

## References

- [ADR 0004](./adr/0004-adopt-backend-owned-session-authentication.md)
- [NestJS authentication documentation](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
