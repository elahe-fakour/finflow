import { Reflector } from "@nestjs/core";
import { BankTransactionsController } from "../src/bank-transactions/bank-transactions.controller.js";
import { WORKSPACE_PERMISSION_KEY } from "../src/workspaces/require-workspace-permission.decorator.js";
import { WorkspacePermission } from "../src/workspaces/workspace-permissions.js";
import { describe, expect, it } from "vitest";

describe("BankTransactionsController", () => {
  it("requires financial-data permission to create a transaction", () => {
    const reflector = new Reflector();

    expect(
      reflector.getAllAndOverride(WORKSPACE_PERMISSION_KEY, [
        BankTransactionsController.prototype.create,
        BankTransactionsController,
      ]),
    ).toBe(WorkspacePermission.MANAGE_FINANCIAL_DATA);
  });
});
