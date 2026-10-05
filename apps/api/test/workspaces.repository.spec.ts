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

  it("looks up access through the composite workspace and user key", async () => {
    const findUnique = vi.fn().mockResolvedValue({ role: WorkspaceRole.MEMBER });
    const repository = new WorkspacesRepository({
      database: {
        workspaceMembership: { findUnique },
      },
    } as unknown as PrismaService);

    await repository.findMembership("workspace-a", "user-a");

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        workspaceId_userId: {
          workspaceId: "workspace-a",
          userId: "user-a",
        },
      },
      select: {
        role: true,
      },
    });
  });

  it("loads workspace metadata using an authorized workspace scope", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = new WorkspacesRepository({
      database: {
        workspace: { findUnique },
      },
    } as unknown as PrismaService);

    await repository.findById({ workspaceId: "workspace-a" });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        id: "workspace-a",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
  });

  it("renames a workspace using the authorized scope", async () => {
    const update = vi.fn().mockResolvedValue({});
    const repository = new WorkspacesRepository({
      database: {
        workspace: { update },
      },
    } as unknown as PrismaService);

    await repository.rename({ workspaceId: "workspace-a" }, "Renamed Studio");

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "workspace-a",
      },
      data: {
        name: "Renamed Studio",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
  });
});
