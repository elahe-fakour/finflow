import type { ExecutionContext } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { AuthenticatedUser } from "../src/auth/auth.service.js";
import { WorkspaceRole } from "../src/generated/prisma/client.js";
import { WorkspacesController } from "../src/workspaces/workspaces.controller.js";
import type { WorkspaceRequest } from "../src/workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../src/workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../src/workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import type { WorkspacesRepository } from "../src/workspaces/workspaces.repository.js";
import type { WorkspacesService } from "../src/workspaces/workspaces.service.js";
import { describe, expect, it, vi } from "vitest";

const alice = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  email: "alice@acme.example",
  displayName: "Alice",
} satisfies AuthenticatedUser;

const bob = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
  email: "bob@contoso.example",
  displayName: "Bob",
} satisfies AuthenticatedUser;

const aliceWorkspaceId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";
const bobWorkspaceId = "6efc89d9-c720-45f6-82cd-ee29e80314b7";

describe("workspace authorization isolation", () => {
  it("allows Alice to reach only her own workspace data", async () => {
    const harness = createHarness();
    const request = createRequest(alice, aliceWorkspaceId);

    await expect(harness.readWorkspace(request)).resolves.toEqual({
      id: aliceWorkspaceId,
      name: "Acme Studio",
      slug: "acme-studio",
      createdAt: new Date("2026-10-05T00:00:00.000Z"),
      role: WorkspaceRole.OWNER,
    });
    expect(harness.getForMember).toHaveBeenCalledWith({
      workspaceId: aliceWorkspaceId,
      role: WorkspaceRole.OWNER,
    });
  });

  it("prevents Alice from reading Bob's workspace before the service can load data", async () => {
    const harness = createHarness();
    const request = createRequest(alice, bobWorkspaceId);

    const error = await harness.readWorkspace(request).catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: "WORKSPACE_NOT_FOUND",
      message: "Workspace not found.",
    });
    expect(harness.findMembership).toHaveBeenCalledWith(bobWorkspaceId, alice.id);
    expect(harness.getForMember).not.toHaveBeenCalled();
  });

  it("prevents Alice from changing Bob's workspace before the service can mutate data", async () => {
    const harness = createHarness(WorkspacePermission.MANAGE_SETTINGS);
    const request = createRequest(alice, bobWorkspaceId);

    const error = await harness
      .renameWorkspace(request, "Attempted cross-workspace rename")
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect(harness.renameForManager).not.toHaveBeenCalled();
  });
});

function createHarness(permission: WorkspacePermission = WorkspacePermission.VIEW) {
  const memberships = new Map<string, WorkspaceRole>([
    [membershipKey(aliceWorkspaceId, alice.id), WorkspaceRole.OWNER],
    [membershipKey(bobWorkspaceId, bob.id), WorkspaceRole.ADMIN],
  ]);
  const findMembership = vi.fn(async (workspaceId: string, userId: string) => {
    const role = memberships.get(membershipKey(workspaceId, userId));

    return role === undefined ? null : { role };
  });
  const membershipGuard = new WorkspaceMembershipGuard({
    findMembership,
  } as unknown as WorkspacesRepository);
  const permissionGuard = new WorkspacePermissionGuard({
    getAllAndOverride: vi.fn().mockReturnValue(permission),
  } as unknown as Reflector);
  const getForMember = vi.fn().mockResolvedValue({
    id: aliceWorkspaceId,
    name: "Acme Studio",
    slug: "acme-studio",
    createdAt: new Date("2026-10-05T00:00:00.000Z"),
    role: WorkspaceRole.OWNER,
  });
  const renameForManager = vi.fn();
  const controller = new WorkspacesController({
    getForMember,
    renameForManager,
  } as unknown as WorkspacesService);

  return {
    findMembership,
    getForMember,
    renameForManager,
    async readWorkspace(request: WorkspaceRequest) {
      await membershipGuard.canActivate(createContext(request));
      permissionGuard.canActivate(createContext(request));

      return controller.getById(request.workspaceAccess!);
    },
    async renameWorkspace(request: WorkspaceRequest, name: string) {
      await membershipGuard.canActivate(createContext(request));
      permissionGuard.canActivate(createContext(request));

      return controller.rename(request.workspaceAccess!, { name });
    },
  };
}

function createRequest(user: AuthenticatedUser, workspaceId: string): WorkspaceRequest {
  return {
    params: { workspaceId },
    user,
  };
}

function membershipKey(workspaceId: string, userId: string): string {
  return `${workspaceId}:${userId}`;
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
