import type { Customer } from "../src/generated/prisma/client.js";
import { CustomersRepository } from "../src/customers/customers.repository.js";
import { CustomersService } from "../src/customers/customers.service.js";
import type { TransactionClient } from "../src/database/financial-transaction.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import type { WorkspaceScope } from "../src/workspaces/workspace-scope.js";
import { describe, expect, it, vi } from "vitest";

const workspaceScope: WorkspaceScope = {
  workspaceId: "workspace-a",
};

describe("CustomersRepository", () => {
  it("uses the workspace and customer ID together for an exact lookup", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = new CustomersRepository({
      database: {
        customer: {
          findUnique,
        },
      },
    } as unknown as PrismaService);

    await repository.findById(workspaceScope, "customer-a");

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_id: {
          workspaceId: "workspace-a",
          id: "customer-a",
        },
      },
    });
  });

  it("lists only records in the requested workspace", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new CustomersRepository({
      database: {
        customer: {
          findMany,
        },
      },
    } as unknown as PrismaService);

    await repository.list(workspaceScope);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        workspaceId: "workspace-a",
      },
      orderBy: {
        name: "asc",
      },
    });
  });

  it("uses the supplied transaction client for a transaction-bound query", async () => {
    const transactionFindUnique = vi.fn().mockResolvedValue(null);
    const repository = new CustomersRepository({
      database: {
        customer: {
          findUnique: vi.fn(),
        },
      },
    } as unknown as PrismaService);
    const transaction = {
      customer: {
        findUnique: transactionFindUnique,
      },
    } as unknown as TransactionClient;

    await repository.findById(workspaceScope, "customer-a", transaction);

    expect(transactionFindUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_id: {
          workspaceId: "workspace-a",
          id: "customer-a",
        },
      },
    });
  });
});

describe("CustomersService", () => {
  it("returns a customer found within the requested workspace", async () => {
    const customer = { id: "customer-a" } as Customer;
    const findById = vi.fn().mockResolvedValue(customer);
    const service = new CustomersService({
      findById,
    } as unknown as CustomersRepository);

    await expect(service.getById(workspaceScope, "customer-a")).resolves.toBe(customer);
    expect(findById).toHaveBeenCalledWith(workspaceScope, "customer-a");
  });

  it("does not reveal whether a missing customer belongs to another workspace", async () => {
    const service = new CustomersService({
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as CustomersRepository);

    await expect(service.getById(workspaceScope, "customer-b")).rejects.toThrow(
      "Customer not found.",
    );
  });
});
