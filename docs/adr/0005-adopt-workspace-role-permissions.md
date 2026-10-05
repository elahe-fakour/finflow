# ADR 0005: Adopt Explicit Workspace Role Permissions

- Status: Accepted
- Date: 2026-10-04

## Context

FinFlow users can belong to more than one workspace. Authentication identifies a
user and `WorkspaceMembershipGuard` confirms that the user belongs to the
workspace in a request, but membership alone is not enough to decide whether the
user may change financial data or workspace settings.

The MVP needs four fixed roles: `OWNER`, `ADMIN`, `ACCOUNTANT`, and `MEMBER`.
It does not need custom roles or per-user exception rules, which would complicate
both authorization review and customer support before the product needs them.

## Decision

Keep roles in `WorkspaceMembership`, but authorize routes through named,
business-oriented permissions. A route declares one permission with
`@RequireWorkspacePermission(...)`; `WorkspacePermissionGuard` evaluates the
authenticated user's current membership role against the central policy.

| Permission                          | Owner | Admin | Accountant | Member |
| ----------------------------------- | ----- | ----- | ---------- | ------ |
| View workspace data                 | Yes   | Yes   | Yes        | Yes    |
| Manage workspace settings           | Yes   | Yes   | No         | No     |
| Manage financial data               | Yes   | Yes   | Yes        | No     |
| Manage members                      | Yes   | Yes   | No         | No     |
| Manage ownership / critical control | Yes   | No    | No         | No     |

The initial routes demonstrate the policy: every member may view workspace
metadata, while only Owner and Admin may rename it. Future financial endpoints
will declare `MANAGE_FINANCIAL_DATA`; membership-management endpoints will use
`MANAGE_MEMBERS`; transfer of ownership and similarly critical operations will
use `MANAGE_OWNERSHIP`.

`WorkspaceMembershipGuard` runs before the permission guard. No membership
returns a non-disclosing `404 WORKSPACE_NOT_FOUND`; a known member without the
required permission receives `403 WORKSPACE_PERMISSION_DENIED`. The permission
guard denies a route with missing permission metadata rather than allowing it by
default.

The API reads the current role from PostgreSQL on each protected request. Roles
are not embedded in session cookies, so a future role change becomes effective
without trusting stale client-held authorization claims.

## Consequences

- Permission policy is centralized and can be reviewed independently of route
  implementation.
- Controllers state the business operation they require rather than comparing
  role strings themselves.
- Custom roles, per-user overrides, approval workflows, and temporal
  permissions remain out of MVP scope.
- Every future workspace-scoped route must use both the membership guard and an
  explicit permission declaration.

## Alternatives Considered

- **Role checks inside controllers:** easy at first, but duplicates policy and
  is easy to forget on a new route.
- **A numeric role hierarchy:** cannot model the Accountant role cleanly; an
  Accountant can manage financial data but should not manage workspace settings
  or members.
- **Custom permissions stored per user:** flexible but premature for the MVP;
  it increases data modelling, UI, audit, and support requirements.
