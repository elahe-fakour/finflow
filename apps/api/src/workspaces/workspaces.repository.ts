import { Injectable } from "@nestjs/common";
import { WorkspaceRole, type PrismaClient } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "./workspace-scope.js";

type WorkspaceQueryClient = Pick<
  PrismaClient,
  "user" | "workspace" | "workspaceInvitation" | "workspaceMembership"
>;

export type WorkspaceWithOwnerMembership = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  memberships: Array<{
    role: WorkspaceRole;
  }>;
};

export type CreateWorkspaceWithOwnerInput = {
  name: string;
  slug: string;
  ownerUserId: string;
};

export type WorkspaceMembershipAccess = {
  role: WorkspaceRole;
};

export type WorkspaceMember = {
  createdAt: Date;
  displayName: string | null;
  email: string;
  role: WorkspaceRole;
  userId: string;
};

export type WorkspaceUser = {
  displayName: string | null;
  email: string;
  id: string;
};

export type WorkspaceInvitationRecord = {
  acceptedAt: Date | null;
  email: string;
  expiresAt: Date;
  id: string;
  role: WorkspaceRole;
  workspaceId: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export type WorkspaceMembershipSummary = WorkspaceSummary & {
  role: WorkspaceRole;
};

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithOwner(
    input: CreateWorkspaceWithOwnerInput,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceWithOwnerMembership> {
    return database.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        memberships: {
          create: {
            userId: input.ownerUserId,
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
  }

  findMembership(
    workspaceId: string,
    userId: string,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceMembershipAccess | null> {
    return database.workspaceMembership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });
  }

  async listForUser(
    userId: string,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceMembershipSummary[]> {
    const memberships = await database.workspaceMembership.findMany({
      where: { userId },
      select: {
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        workspace: {
          name: "asc",
        },
      },
    });

    return memberships.map(({ role, workspace }) => ({ ...workspace, role }));
  }

  findById(
    scope: WorkspaceScope,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceSummary | null> {
    return database.workspace.findUnique({
      where: {
        id: scope.workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
  }

  async listMembers(
    scope: WorkspaceScope,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceMember[]> {
    const memberships = await database.workspaceMembership.findMany({
      where: { workspaceId: scope.workspaceId },
      select: {
        createdAt: true,
        role: true,
        user: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: [{ role: "asc" }, { user: { email: "asc" } }],
    });

    return memberships.map(({ createdAt, role, user }) => ({
      createdAt,
      displayName: user.displayName,
      email: user.email,
      role,
      userId: user.id,
    }));
  }

  findUserByEmail(
    email: string,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceUser | null> {
    return database.user.findUnique({
      where: { email },
      select: { id: true, displayName: true, email: true },
    });
  }

  createMembership(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    database: WorkspaceQueryClient = this.prisma.database,
  ) {
    return database.workspaceMembership.create({
      data: { workspaceId, userId, role },
      select: {
        createdAt: true,
        role: true,
        user: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  createInvitation(
    input: {
      email: string;
      expiresAt: Date;
      invitedById: string;
      role: WorkspaceRole;
      tokenHash: string;
      workspaceId: string;
    },
    database: WorkspaceQueryClient = this.prisma.database,
  ) {
    return database.workspaceInvitation.create({
      data: input,
      select: {
        acceptedAt: true,
        email: true,
        expiresAt: true,
        id: true,
        role: true,
        workspaceId: true,
      },
    });
  }

  findInvitationByTokenHash(
    tokenHash: string,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceInvitationRecord | null> {
    return database.workspaceInvitation.findUnique({
      where: { tokenHash },
      select: {
        acceptedAt: true,
        email: true,
        expiresAt: true,
        id: true,
        role: true,
        workspaceId: true,
      },
    });
  }

  markInvitationAccepted(id: string, database: WorkspaceQueryClient = this.prisma.database) {
    return database.workspaceInvitation.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  }

  rename(
    scope: WorkspaceScope,
    name: string,
    database: WorkspaceQueryClient = this.prisma.database,
  ): Promise<WorkspaceSummary> {
    return database.workspace.update({
      where: {
        id: scope.workspaceId,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
  }
}
