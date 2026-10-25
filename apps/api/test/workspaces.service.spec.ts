import { ForbiddenException } from "@nestjs/common";
import { Prisma, WorkspaceRole } from "../src/generated/prisma/client.js";
import type { AuthenticatedUser } from "../src/auth/auth.service.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import type { TransactionClient } from "../src/database/financial-transaction.js";
import { WorkspacesService, type CreatedWorkspace } from "../src/workspaces/workspaces.service.js";
import type { WorkspacesRepository } from "../src/workspaces/workspaces.repository.js";
import { describe, expect, it, vi } from "vitest";

const owner = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  email: "owner@acme.example",
  displayName: "Acme Owner",
} satisfies AuthenticatedUser;

const createdWorkspace = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
  name: "Acme Studio",
  slug: "acme-studio-12ab34cd56ef",
  createdAt: new Date("2026-10-04T12:00:00.000Z"),
  memberships: [{ role: WorkspaceRole.OWNER }],
};

describe("WorkspacesService", () => {
  it("creates a workspace and owner membership in one database transaction", async () => {
    const transaction = {} as TransactionClient;
    const createWithOwner = vi.fn().mockResolvedValue(createdWorkspace);
    const withTransaction = vi.fn(async (work) => work(transaction));
    const service = new WorkspacesService(
      { withTransaction } as unknown as PrismaService,
      { createWithOwner } as unknown as WorkspacesRepository,
    );

    await expect(service.createForOwner(owner, { name: "Acme Studio" })).resolves.toEqual({
      id: createdWorkspace.id,
      name: createdWorkspace.name,
      slug: createdWorkspace.slug,
      role: WorkspaceRole.OWNER,
      createdAt: createdWorkspace.createdAt,
    } satisfies CreatedWorkspace);

    expect(createWithOwner).toHaveBeenCalledWith(
      {
        name: "Acme Studio",
        ownerUserId: owner.id,
        slug: expect.stringMatching(/^acme-studio-[a-f0-9]{12}$/u),
      },
      transaction,
    );
  });

  it("retries a workspace slug collision before returning success", async () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "test",
    });
    const createWithOwner = vi
      .fn()
      .mockRejectedValueOnce(uniqueConstraintError)
      .mockResolvedValue(createdWorkspace);
    const service = new WorkspacesService(
      {
        withTransaction: vi.fn((work) => work({} as TransactionClient)),
      } as unknown as PrismaService,
      { createWithOwner } as unknown as WorkspacesRepository,
    );

    await expect(service.createForOwner(owner, { name: "Acme Studio" })).resolves.toMatchObject({
      id: createdWorkspace.id,
      role: WorkspaceRole.OWNER,
    });
    expect(createWithOwner).toHaveBeenCalledTimes(2);
  });

  it("returns workspace metadata only after a guard has supplied authorized access", async () => {
    const findById = vi.fn().mockResolvedValue({
      id: createdWorkspace.id,
      name: createdWorkspace.name,
      slug: createdWorkspace.slug,
      createdAt: createdWorkspace.createdAt,
    });
    const service = new WorkspacesService(
      {} as PrismaService,
      { findById } as unknown as WorkspacesRepository,
    );

    await expect(
      service.getForMember({
        workspaceId: createdWorkspace.id,
        role: WorkspaceRole.ACCOUNTANT,
      }),
    ).resolves.toEqual({
      id: createdWorkspace.id,
      name: createdWorkspace.name,
      slug: createdWorkspace.slug,
      createdAt: createdWorkspace.createdAt,
      role: WorkspaceRole.ACCOUNTANT,
    });
    expect(findById).toHaveBeenCalledWith({
      workspaceId: createdWorkspace.id,
      role: WorkspaceRole.ACCOUNTANT,
    });
  });

  it("returns the current role with a renamed workspace", async () => {
    const rename = vi.fn().mockResolvedValue({
      id: createdWorkspace.id,
      name: "Renamed Studio",
      slug: createdWorkspace.slug,
      createdAt: createdWorkspace.createdAt,
    });
    const service = new WorkspacesService(
      {} as PrismaService,
      { rename } as unknown as WorkspacesRepository,
    );
    const access = {
      workspaceId: createdWorkspace.id,
      role: WorkspaceRole.ADMIN,
    };

    await expect(service.renameForManager(access, { name: "Renamed Studio" })).resolves.toEqual({
      id: createdWorkspace.id,
      name: "Renamed Studio",
      slug: createdWorkspace.slug,
      createdAt: createdWorkspace.createdAt,
      role: WorkspaceRole.ADMIN,
    });
    expect(rename).toHaveBeenCalledWith(access, "Renamed Studio");
  });

  it("creates an invitation and records it atomically", async () => {
    const transaction = {
      auditEvent: { create: vi.fn() },
    } as unknown as TransactionClient;
    const createInvitation = vi.fn().mockResolvedValue({
      acceptedAt: null,
      email: "accountant@acme.example",
      expiresAt: new Date("2026-10-27T12:00:00.000Z"),
      id: "invitation-1",
      role: WorkspaceRole.ACCOUNTANT,
      workspaceId: createdWorkspace.id,
    });
    const findPendingInvitation = vi.fn().mockResolvedValue(null);
    const withTransaction = vi.fn(async (work) => work(transaction));
    const service = new WorkspacesService(
      { withTransaction } as unknown as PrismaService,
      { createInvitation, findPendingInvitation } as unknown as WorkspacesRepository,
    );

    await expect(
      service.inviteMember({ workspaceId: createdWorkspace.id, role: WorkspaceRole.OWNER }, owner, {
        email: "accountant@acme.example",
        role: WorkspaceRole.ACCOUNTANT,
      }),
    ).resolves.toMatchObject({ role: WorkspaceRole.ACCOUNTANT, token: expect.any(String) });
    expect(createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "accountant@acme.example",
        role: WorkspaceRole.ACCOUNTANT,
        workspaceId: createdWorkspace.id,
      }),
      transaction,
    );
    expect(transaction.auditEvent.create).toHaveBeenCalled();
  });

  it("prevents assigning the owner role through an invitation", async () => {
    const service = new WorkspacesService({} as PrismaService, {} as WorkspacesRepository);

    await expect(
      service.inviteMember({ workspaceId: createdWorkspace.id, role: WorkspaceRole.ADMIN }, owner, {
        email: "new@acme.example",
        role: WorkspaceRole.OWNER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
