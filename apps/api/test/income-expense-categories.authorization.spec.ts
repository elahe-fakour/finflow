import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedUser } from "../src/auth/auth.service.js";
import { IncomeExpenseType, WorkspaceRole } from "../src/generated/prisma/client.js";
import { IncomeExpenseCategoriesController } from "../src/income-expense-categories/income-expense-categories.controller.js";
import type { IncomeExpenseCategoriesService } from "../src/income-expense-categories/income-expense-categories.service.js";
import type { WorkspaceRequest } from "../src/workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../src/workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../src/workspaces/workspace-permission.guard.js";
import type { WorkspacesRepository } from "../src/workspaces/workspaces.repository.js";
import { describe, expect, it, vi } from "vitest";

const alice = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  email: "alice@acme.example",
  displayName: "Alice",
} satisfies AuthenticatedUser;
const aliceWorkspaceId = "6efc89d9-c720-45f6-82cd-ee29e80314b5";
const bobWorkspaceId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";

describe("income and expense category authorization", () => {
  it("allows an accountant to create a category in their own workspace", async () => {
    const harness = createHarness(WorkspaceRole.ACCOUNTANT);
    const request = createRequest(aliceWorkspaceId);

    await harness.create(request);

    expect(harness.createCategory).toHaveBeenCalledWith(
      { workspaceId: aliceWorkspaceId, role: WorkspaceRole.ACCOUNTANT },
      { type: IncomeExpenseType.EXPENSE, name: "Software subscriptions" },
    );
  });

  it("prevents a member from creating a category", async () => {
    const harness = createHarness(WorkspaceRole.MEMBER);
    const request = createRequest(aliceWorkspaceId);

    const error = await harness.create(request).catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(harness.createCategory).not.toHaveBeenCalled();
  });

  it("prevents a user from reaching category mutations in another workspace", async () => {
    const harness = createHarness(WorkspaceRole.ACCOUNTANT);
    const request = createRequest(bobWorkspaceId);

    const error = await harness.create(request).catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(NotFoundException);
    expect(harness.findMembership).toHaveBeenCalledWith(bobWorkspaceId, alice.id);
    expect(harness.createCategory).not.toHaveBeenCalled();
  });
});

function createHarness(role: WorkspaceRole) {
  const findMembership = vi.fn(async (workspaceId: string, userId: string) =>
    workspaceId === aliceWorkspaceId && userId === alice.id ? { role } : null,
  );
  const membershipGuard = new WorkspaceMembershipGuard({
    findMembership,
  } as unknown as WorkspacesRepository);
  const permissionGuard = new WorkspacePermissionGuard(new Reflector());
  const createCategory = vi.fn().mockResolvedValue({});
  const controller = new IncomeExpenseCategoriesController({
    create: createCategory,
  } as unknown as IncomeExpenseCategoriesService);

  return {
    findMembership,
    createCategory,
    async create(request: WorkspaceRequest) {
      await membershipGuard.canActivate(createContext(request, "create"));
      permissionGuard.canActivate(createContext(request, "create"));

      return controller.create(request.workspaceAccess!, {
        type: IncomeExpenseType.EXPENSE,
        name: "Software subscriptions",
      });
    },
  };
}

function createRequest(workspaceId: string): WorkspaceRequest {
  return {
    params: { workspaceId },
    user: alice,
  };
}

function createContext(
  request: WorkspaceRequest,
  handler: keyof IncomeExpenseCategoriesController,
): ExecutionContext {
  return {
    getClass: () => IncomeExpenseCategoriesController,
    getHandler: () => IncomeExpenseCategoriesController.prototype[handler],
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
