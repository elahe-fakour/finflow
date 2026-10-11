import { BankAccountStatus } from "../src/generated/prisma/client.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import { BankAccountsRepository } from "../src/bank-accounts/bank-accounts.repository.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b5" };
const bankAccountId = "6efc89d9-c720-45f6-82cd-ee29e80314b6";

describe("BankAccountsRepository", () => {
  it("lists only accounts in the authorized workspace with an optional status filter", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = createRepository({ findMany });

    await repository.list(scope, BankAccountStatus.ACTIVE);

    expect(findMany).toHaveBeenCalledWith({
      where: { workspaceId: scope.workspaceId, status: BankAccountStatus.ACTIVE },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
  });

  it("uses the composite workspace and account key for an exact lookup", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = createRepository({ findUnique });

    await repository.findById(scope, bankAccountId);

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: bankAccountId,
        },
      },
    });
  });

  it("creates an account inside the authorized workspace", async () => {
    const create = vi.fn().mockResolvedValue({});
    const repository = createRepository({ create });
    const input = {
      name: "Operating account",
      type: "CHECKING" as const,
      currency: "USD",
      institutionName: null,
      accountLastFour: null,
      openingBalanceMinorUnits: 0n,
      openingBalanceDate: null,
    };

    await repository.create(scope, input);

    expect(create).toHaveBeenCalledWith({
      data: { workspaceId: scope.workspaceId, ...input },
    });
  });
});

function createRepository(bankAccountDelegate: Record<string, ReturnType<typeof vi.fn>>) {
  return new BankAccountsRepository({
    database: {
      bankAccount: bankAccountDelegate,
    },
  } as unknown as PrismaService);
}
