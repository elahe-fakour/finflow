import type { PrismaService } from "../src/database/prisma.service.js";
import { VendorsRepository } from "../src/vendors/vendors.repository.js";
import { describe, expect, it, vi } from "vitest";

const scope = { workspaceId: "6efc89d9-c720-45f6-82cd-ee29e80314b5" };

describe("VendorsRepository", () => {
  it("lists only vendor options from the authorized workspace in name order", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new VendorsRepository({
      database: { vendor: { findMany } },
    } as unknown as PrismaService);

    await repository.list(scope);

    expect(findMany).toHaveBeenCalledWith({
      where: { workspaceId: scope.workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });
});
