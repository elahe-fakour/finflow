import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { WorkspaceRole } from "../src/generated/prisma/client.js";
import { WorkspacePermissionGuard } from "../src/workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import type { WorkspaceRequest } from "../src/workspaces/workspace-access.js";
import { describe, expect, it, vi } from "vitest";

const workspaceId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";

describe("WorkspacePermissionGuard", () => {
  it.each([
    [WorkspaceRole.OWNER, WorkspacePermission.MANAGE_OWNERSHIP],
    [WorkspaceRole.ADMIN, WorkspacePermission.MANAGE_SETTINGS],
    [WorkspaceRole.ACCOUNTANT, WorkspacePermission.MANAGE_FINANCIAL_DATA],
    [WorkspaceRole.MEMBER, WorkspacePermission.VIEW],
  ] as const)("allows %s to perform %s", (role, permission) => {
    const guard = createGuard(permission);

    expect(
      guard.canActivate(
        createContext({
          params: { workspaceId },
          workspaceAccess: { workspaceId, role },
        }),
      ),
    ).toBe(true);
  });

  it("denies an accountant from changing workspace settings", async () => {
    const guard = createGuard(WorkspacePermission.MANAGE_SETTINGS);

    const error = await Promise.resolve()
      .then(() =>
        guard.canActivate(
          createContext({
            params: { workspaceId },
            workspaceAccess: { workspaceId, role: WorkspaceRole.ACCOUNTANT },
          }),
        ),
      )
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual({
      code: "WORKSPACE_PERMISSION_DENIED",
      message: "You do not have permission to perform this action in this workspace.",
    });
  });

  it("fails closed when a route has no declared permission", async () => {
    const guard = createGuard(undefined);

    const error = await Promise.resolve()
      .then(() =>
        guard.canActivate(
          createContext({
            params: { workspaceId },
            workspaceAccess: { workspaceId, role: WorkspaceRole.OWNER },
          }),
        ),
      )
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(ForbiddenException);
  });
});

function createGuard(permission: WorkspacePermission | undefined): WorkspacePermissionGuard {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(permission),
  };

  return new WorkspacePermissionGuard(reflector as unknown as Reflector);
}

function createContext(request: WorkspaceRequest): ExecutionContext {
  return {
    getClass: () => class TestController {},
    getHandler: () => () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
