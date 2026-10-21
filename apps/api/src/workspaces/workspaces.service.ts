import { randomUUID } from "node:crypto";
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, WorkspaceRole } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import type { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import type { InviteWorkspaceMemberDto } from "./dto/invite-workspace-member.dto.js";
import type { RenameWorkspaceDto } from "./dto/rename-workspace.dto.js";
import type { WorkspaceAccess } from "./workspace-access.js";
import { WorkspacesRepository, type WorkspaceMember } from "./workspaces.repository.js";

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

  async listMembers(access: WorkspaceAccess): Promise<WorkspaceMember[]> {
    return this.workspacesRepository.listMembers(access);
  }

  async inviteMember(
    access: WorkspaceAccess,
    actor: AuthenticatedUser,
    input: InviteWorkspaceMemberDto,
  ): Promise<WorkspaceMember> {
    if (!canAssignRole(access.role, input.role)) {
      throw new ForbiddenException({
        code: "WORKSPACE_ROLE_ASSIGNMENT_FORBIDDEN",
        message: "You do not have permission to assign that workspace role.",
      });
    }

    const invitedUser = await this.workspacesRepository.findUserByEmail(input.email);

    if (invitedUser === null) {
      throw new NotFoundException({
        code: "INVITED_USER_NOT_FOUND",
        message: "No FinFlow account was found for that email address.",
      });
    }

    try {
      return await this.prisma.withTransaction(async (transaction) => {
        const membership = await this.workspacesRepository.createMembership(
          access.workspaceId,
          invitedUser.id,
          input.role,
          transaction,
        );

        await transaction.auditEvent.create({
          data: {
            action: "WORKSPACE_MEMBER_INVITED",
            actorUserId: actor.id,
            entity: "WorkspaceMembership",
            entityId: invitedUser.id,
            metadata: { invitedEmail: invitedUser.email, role: input.role },
            workspaceId: access.workspaceId,
          },
        });

        return {
          createdAt: membership.createdAt,
          displayName: membership.user.displayName,
          email: membership.user.email,
          role: membership.role,
          userId: membership.user.id,
        };
      });
    } catch (error) {
      if (isMembershipConflict(error)) {
        throw new ConflictException({
          code: "WORKSPACE_MEMBER_ALREADY_EXISTS",
          message: "This user is already a member of the workspace.",
        });
      }

      throw error;
    }
  }

  listForUser(user: AuthenticatedUser): Promise<AccessibleWorkspace[]> {
    return this.workspacesRepository.listForUser(user.id);
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

function isMembershipConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function canAssignRole(actorRole: WorkspaceRole, invitedRole: WorkspaceRole): boolean {
  if (invitedRole === WorkspaceRole.OWNER) return false;
  return actorRole === WorkspaceRole.OWNER || invitedRole !== WorkspaceRole.ADMIN;
}
