import { WorkspaceRole } from "../src/generated/prisma/client.js";
import { WorkspacesRepository } from "../src/workspaces/workspaces.repository.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import { describe, expect, it, vi } from "vitest";

describe("WorkspacesRepository", () => {
  it("creates the workspace and its owner membership together", async () => {
    const create = vi.fn().mockResolvedValue({});
    const repository = new WorkspacesRepository({
      database: {
        workspace: { create },
      },
    } as unknown as PrismaService);

    await repository.createWithOwner({
      name: "Acme Studio",
      slug: "acme-studio-12ab34cd56ef",
      ownerUserId: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Acme Studio",
        slug: "acme-studio-12ab34cd56ef",
        memberships: {
          create: {
            userId: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
            role: WorkspaceRole.OWNER,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
          },
        },
      },
    });
  });
});
