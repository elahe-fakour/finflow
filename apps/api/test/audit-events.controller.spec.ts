import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { AuditEventsController } from "../src/audit-events/audit-events.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";

describe("AuditEventsController", () => {
  it("requires the dedicated audit log permission", () => {
    const reflector = new Reflector();

    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        AuditEventsController.prototype.list,
        AuditEventsController,
      ]),
    ).toBe(WorkspacePermission.VIEW_AUDIT_LOG);
  });
});
