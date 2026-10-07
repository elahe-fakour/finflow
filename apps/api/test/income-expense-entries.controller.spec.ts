import { Reflector } from "@nestjs/core";
import { IncomeExpenseEntriesController } from "../src/income-expense-entries/income-expense-entries.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import { describe, expect, it } from "vitest";

describe("IncomeExpenseEntriesController", () => {
  const reflector = new Reflector();

  it.each([
    ["list", WorkspacePermission.VIEW],
    ["getById", WorkspacePermission.VIEW],
    ["create", WorkspacePermission.MANAGE_FINANCIAL_DATA],
    ["update", WorkspacePermission.MANAGE_FINANCIAL_DATA],
  ] as const)("declares %s with %s authorization", (method, permission) => {
    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        IncomeExpenseEntriesController.prototype[method],
        IncomeExpenseEntriesController,
      ]),
    ).toBe(permission);
  });
});
