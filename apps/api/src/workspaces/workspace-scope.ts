/**
 * Identifies the tenant boundary for a repository or service operation.
 *
 * This is not an authorization assertion. Phase 7 guards will verify that the
 * authenticated actor is a member of this workspace before calling feature
 * services with a scope.
 */
export type WorkspaceScope = Readonly<{
  workspaceId: string;
}>;
