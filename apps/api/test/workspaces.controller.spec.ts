import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { WorkspacesController } from "../src/workspaces/workspaces.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";

describe("WorkspacesController", () => {
  it("requires member-management permission to list members", () => {
    const reflector = new Reflector();

    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        WorkspacesController.prototype.listMembers,
        WorkspacesController,
      ]),
    ).toBe(WorkspacePermission.MANAGE_MEMBERS);
  });
});
