# ADR 0003: Keep Invitation Delivery Behind a Secure Boundary

## Status

Accepted

## Context

FinFlow stores invitation tokens as SHA-256 hashes. A hash is intentionally
one-way, so a background worker cannot reconstruct an invitation URL later.
Persisting the raw token in an outbox would make a database read sufficient to
take over an invitation.

## Decision

Invitation creation exposes an `InvitationDelivery` boundary that receives the
raw token only in memory during the request. The current implementation is a
development no-op. A future provider may send the message immediately after a
successful transaction, or an outbox may store encrypted token material after
we select key management and rotation rules.

## Consequences

- The database never stores a raw invitation token.
- Email provider integration is isolated from workspace business logic.
- A durable outbox is deferred until encryption and key rotation are designed.
- Local development can continue without SMTP credentials.
