import type { ExecutionContext } from "@nestjs/common";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { WorkspaceRole } from "../src/generated/prisma/client.js";
import type { AuthenticatedUser } from "../src/auth/auth.service.js";
import { WorkspaceMembershipGuard } from "../src/workspaces/workspace-membership.guard.js";
import type { WorkspaceRequest } from "../src/workspaces/workspace-access.js";
import type { WorkspacesRepository } from "../src/workspaces/workspaces.repository.js";
import { describe, expect, it, vi } from "vitest";

const user = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  email: "owner@acme.example",
  displayName: "Acme Owner",
} satisfies AuthenticatedUser;

const workspaceId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";

describe("WorkspaceMembershipGuard", () => {
  it("authorizes a member and attaches a server-authorized workspace scope", async () => {
    const findMembership = vi.fn().mockResolvedValue({ role: WorkspaceRole.ACCOUNTANT });
    const request: WorkspaceRequest = {
      params: { workspaceId },
      user,
    };
    const guard = new WorkspaceMembershipGuard({
      findMembership,
    } as unknown as WorkspacesRepository);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(findMembership).toHaveBeenCalledWith(workspaceId, user.id);
    expect(request.workspaceAccess).toEqual({
      workspaceId,
      role: WorkspaceRole.ACCOUNTANT,
    });
  });

  it("returns a non-disclosing not-found response for a non-member", async () => {
    const guard = new WorkspaceMembershipGuard({
      findMembership: vi.fn().mockResolvedValue(null),
    } as unknown as WorkspacesRepository);

    const error = await guard
      .canActivate(
        createContext({
          params: { workspaceId },
          user,
        }),
      )
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toEqual({
      code: "WORKSPACE_NOT_FOUND",
      message: "Workspace not found.",
    });
  });

  it("fails closed when authentication has not populated the request user", async () => {
    const findMembership = vi.fn();
    const guard = new WorkspaceMembershipGuard({
      findMembership,
    } as unknown as WorkspacesRepository);

    const error = await guard
      .canActivate(createContext({ params: { workspaceId } }))
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(findMembership).not.toHaveBeenCalled();
  });
});

function createContext(request: WorkspaceRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
