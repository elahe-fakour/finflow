import { Reflector } from "@nestjs/core";
import { BankAccountsController } from "../src/bank-accounts/bank-accounts.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import { describe, expect, it } from "vitest";

describe("BankAccountsController", () => {
  const reflector = new Reflector();

  it.each([
    ["list", WorkspacePermission.VIEW],
    ["getById", WorkspacePermission.VIEW],
    ["create", WorkspacePermission.MANAGE_FINANCIAL_DATA],
    ["update", WorkspacePermission.MANAGE_FINANCIAL_DATA],
  ] as const)("declares %s with %s authorization", (method, permission) => {
    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        BankAccountsController.prototype[method],
        BankAccountsController,
      ]),
    ).toBe(permission);
  });
});
