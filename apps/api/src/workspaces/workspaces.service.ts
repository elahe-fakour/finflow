import { randomUUID } from "node:crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WorkspaceRole } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import type { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import type { RenameWorkspaceDto } from "./dto/rename-workspace.dto.js";
import type { WorkspaceAccess } from "./workspace-access.js";
import { WorkspacesRepository } from "./workspaces.repository.js";

const MAX_SLUG_LENGTH = 100;
const SLUG_SUFFIX_LENGTH = 12;
const MAX_SLUG_ATTEMPTS = 3;

export type CreatedWorkspace = {
  id: string;
  name: string;
  slug: string;
  role: typeof WorkspaceRole.OWNER;
  createdAt: Date;
};

export type AccessibleWorkspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  role: WorkspaceRole;
};

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesRepository: WorkspacesRepository,
  ) {}

  async createForOwner(
    owner: AuthenticatedUser,
    input: CreateWorkspaceDto,
  ): Promise<CreatedWorkspace> {
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      try {
        const workspace = await this.prisma.withTransaction((transaction) =>
          this.workspacesRepository.createWithOwner(
            {
              name: input.name,
              slug: createWorkspaceSlug(input.name),
              ownerUserId: owner.id,
            },
            transaction,
          ),
        );
        const membership = workspace.memberships[0];

        if (membership?.role !== WorkspaceRole.OWNER) {
          throw new Error("Workspace creation did not create an owner membership.");
        }

        return {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: WorkspaceRole.OWNER,
          createdAt: workspace.createdAt,
        };
      } catch (error) {
        if (isUniqueSlugViolation(error) && attempt < MAX_SLUG_ATTEMPTS - 1) {
          continue;
        }

        if (isUniqueSlugViolation(error)) {
          throw new ConflictException({
            code: "WORKSPACE_SLUG_UNAVAILABLE",
            message: "A unique workspace identifier could not be created. Please try again.",
          });
        }

        throw error;
      }
    }

    throw new Error("Workspace slug allocation unexpectedly exhausted its attempts.");
  }

  async getForMember(access: WorkspaceAccess): Promise<AccessibleWorkspace> {
    const workspace = await this.workspacesRepository.findById(access);

    if (workspace === null) {
      throw new NotFoundException({
        code: "WORKSPACE_NOT_FOUND",
        message: "Workspace not found.",
      });
    }

    return {
      ...workspace,
      role: access.role,
    };
  }

  async renameForManager(
    access: WorkspaceAccess,
    input: RenameWorkspaceDto,
  ): Promise<AccessibleWorkspace> {
    try {
      const workspace = await this.workspacesRepository.rename(access, input.name);

      return {
        ...workspace,
        role: access.role,
      };
    } catch (error) {
      if (isWorkspaceMissing(error)) {
        throw new NotFoundException({
          code: "WORKSPACE_NOT_FOUND",
          message: "Workspace not found.",
        });
      }

      throw error;
    }
  }
}

function createWorkspaceSlug(name: string): string {
  const words = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g);
  const base = words?.join("-") || "workspace";
  const suffix = randomUUID().replaceAll("-", "").slice(0, SLUG_SUFFIX_LENGTH);
  const maxBaseLength = MAX_SLUG_LENGTH - suffix.length - 1;

  return `${base.slice(0, maxBaseLength).replace(/-+$/u, "") || "workspace"}-${suffix}`;
}

function isUniqueSlugViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isWorkspaceMissing(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
