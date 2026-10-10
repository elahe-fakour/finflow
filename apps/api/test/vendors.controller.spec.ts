import { Reflector } from "@nestjs/core";
import { VendorsController } from "../src/vendors/vendors.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import { describe, expect, it } from "vitest";

describe("VendorsController", () => {
  it("declares list with view authorization", () => {
    const reflector = new Reflector();

    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        VendorsController.prototype.list,
        VendorsController,
      ]),
    ).toBe(WorkspacePermission.VIEW);
  });
});
