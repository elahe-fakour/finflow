# Workspace Authorization Review

## Scope and Method

This is a source-level review of the API controllers, global authentication
configuration, workspace guards, and role-permission map. It records the current
authorization boundary; it is not a penetration test or a substitute for the
workspace-isolation and RBAC integration tests planned in Phase 13.

The API configures session authentication as a global guard. Public endpoints
must opt out with `@Public()`. Workspace data controllers then apply
`WorkspaceMembershipGuard` and `WorkspacePermissionGuard`; the membership guard
looks up the caller's membership using both the route workspace ID and the
authenticated user ID, and attaches that authorized scope for the handler.
Workspace repositories and service calls use that scope for tenant-bound data
access.

## Route Coverage

| Route group                           | Read access                | Mutation access                           | Scope                                                                      |
| ------------------------------------- | -------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| Workspace profile                     | `workspace:view`           | `workspace:manage-settings`               | Membership and permission guards on each workspace route                   |
| Workspace members and invitations     | `workspace:manage-members` | `workspace:manage-members`                | Membership and permission guards; invitation creation is also rate limited |
| Vendors                               | `workspace:view`           | Not exposed by the current API controller | Membership and permission guards                                           |
| Customers                             | No standalone HTTP route   | No standalone HTTP route                  | Customer service is used by other scoped workflows                         |
| Bank accounts                         | `workspace:view`           | `workspace:manage-financial-data`         | Membership and permission guards                                           |
| Bank transactions and imports         | `workspace:view`           | `workspace:manage-financial-data`         | Membership and permission guards                                           |
| Income/expense categories and entries | `workspace:view`           | `workspace:manage-financial-data`         | Membership and permission guards                                           |
| Reconciliation                        | `workspace:view`           | `workspace:manage-financial-data`         | Membership and permission guards                                           |
| Reports                               | `workspace:view`           | Read-only                                 | Membership and permission guards                                           |
| Audit events                          | `workspace:view-audit-log` | Read-only                                 | Membership and permission guards                                           |

Health and readiness endpoints are explicitly public for hosting probes. Login,
registration, and logout opt out of the global session guard. Invitation
acceptance requires authentication but is not workspace-guarded because the
single-use token identifies the workspace and the service validates it.
Workspace creation and listing require authentication but do not use workspace
guards because they operate on the current user's own account. Development
invitation-delivery endpoints require authentication, are rate-limited, and
reject requests when `NODE_ENV` is production.

The role map currently grants:

- **Owner:** all workspace permissions.
- **Admin:** view, manage settings, manage financial data, and manage members.
- **Accountant:** view, manage financial data, and view the audit log.
- **Member:** view only.

## Findings and Follow-up

- **No missing workspace permission declaration found** in the reviewed
  workspace-scoped controller handlers. The permission guard denies a route if
  a permission declaration or authorized scope is missing.
- Vendors currently expose a list endpoint only. The Customers module has no
  standalone HTTP controller; customer operations are currently service-level
  building blocks. Any future customer or vendor routes must declare an explicit
  permission and preserve workspace-scoped repository access.
- Rate-limit counters are shared through PostgreSQL so limits apply across API
  instances. This is intended for the current low-volume invitation routes and
  does not replace host-level protection from broad denial-of-service traffic.
- Add integration coverage for cross-workspace access and role matrices in
  Phase 13. This review does not claim those behaviors have been exercised
  end-to-end.

Revisit this review when adding a controller, route, or permission. Do not treat
the UI's hidden or disabled actions as authorization; API guards remain the
source of enforcement.
