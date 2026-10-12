import { Reflector } from "@nestjs/core";
import { BankTransactionsController } from "../src/bank-transactions/bank-transactions.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import { describe, expect, it } from "vitest";

describe("BankTransactionsController", () => {
  it.each([
    ["list", WorkspacePermission.VIEW],
    ["create", WorkspacePermission.MANAGE_FINANCIAL_DATA],
  ] as const)("requires %s authorization", (method, permission) => {
    const reflector = new Reflector();

    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        BankTransactionsController.prototype[method],
        BankTransactionsController,
      ]),
    ).toBe(permission);
  });
});
