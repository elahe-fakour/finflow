import { Injectable } from "@nestjs/common";
import { WorkspaceRole, type PrismaClient } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "./workspace-scope.js";

type WorkspaceQueryClient = Pick<PrismaClient, "workspace" | "workspaceMembership">;

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

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
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
}
