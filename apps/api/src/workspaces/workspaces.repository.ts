import { WorkspaceRole, type PrismaClient } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";

type WorkspaceQueryClient = Pick<PrismaClient, "workspace">;

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
}
