import { createHash, randomBytes, randomUUID } from "node:crypto";
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
import {
  WorkspacesRepository,
  type WorkspaceMember,
  type WorkspaceInvitationRecord,
} from "./workspaces.repository.js";

const MAX_SLUG_LENGTH = 100;
const SLUG_SUFFIX_LENGTH = 12;
const MAX_SLUG_ATTEMPTS = 3;
const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

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

export type WorkspaceInvitation = WorkspaceInvitationRecord & { token: string };

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
  ): Promise<WorkspaceInvitation> {
    if (!canAssignRole(access.role, input.role)) {
      throw new ForbiddenException({
        code: "WORKSPACE_ROLE_ASSIGNMENT_FORBIDDEN",
        message: "You do not have permission to assign that workspace role.",
      });
    }

    const existingInvitation = await this.workspacesRepository.findPendingInvitation(
      access.workspaceId,
      input.email,
    );
    if (existingInvitation !== null) {
      throw new ConflictException({
        code: "WORKSPACE_INVITATION_ALREADY_EXISTS",
        message: "An active invitation already exists for this email address.",
      });
    }

    try {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
      return await this.prisma.withTransaction(async (transaction) => {
        const invitation = await this.workspacesRepository.createInvitation(
          {
            email: input.email,
            expiresAt,
            invitedById: actor.id,
            role: input.role,
            tokenHash: hashInvitationToken(token),
            workspaceId: access.workspaceId,
          },
          transaction,
        );

        await transaction.auditEvent.create({
          data: {
            action: "WORKSPACE_MEMBER_INVITED",
            actorUserId: actor.id,
            entity: "WorkspaceMembership",
            entityId: invitation.id,
            metadata: { invitedEmail: input.email, role: input.role },
            workspaceId: access.workspaceId,
          },
        });

        return { ...invitation, token };
      });
    } catch (error) {
      if (isMembershipConflict(error)) {
        throw new ConflictException({
          code: "WORKSPACE_INVITATION_CONFLICT",
          message: "A workspace invitation could not be created. Please try again.",
        });
      }

      throw error;
    }
  }

  async acceptInvitation(token: string, user: AuthenticatedUser) {
    const invitation = await this.workspacesRepository.findInvitationByTokenHash(
      hashInvitationToken(token),
    );

    if (
      invitation === null ||
      invitation.acceptedAt !== null ||
      invitation.revokedAt !== null ||
      invitation.expiresAt <= new Date()
    ) {
      throw new NotFoundException({
        code: "INVITATION_INVALID",
        message: "This invitation is invalid or expired.",
      });
    }

    if (invitation.email !== user.email) {
      throw new ForbiddenException({
        code: "INVITATION_EMAIL_MISMATCH",
        message: "This invitation belongs to a different email address.",
      });
    }

    try {
      return await this.prisma.withTransaction(async (transaction) => {
        const membership = await this.workspacesRepository.createMembership(
          invitation.workspaceId,
          user.id,
          invitation.role,
          transaction,
        );
        await this.workspacesRepository.markInvitationAccepted(invitation.id, transaction);
        await transaction.auditEvent.create({
          data: {
            action: "WORKSPACE_INVITATION_ACCEPTED",
            actorUserId: user.id,
            entity: "WorkspaceMembership",
            entityId: user.id,
            metadata: { invitationId: invitation.id, role: invitation.role },
            workspaceId: invitation.workspaceId,
          },
        });
        return membership;
      });
    } catch (error) {
      if (isMembershipConflict(error)) {
        throw new ConflictException({
          code: "WORKSPACE_MEMBER_ALREADY_EXISTS",
          message: "You are already a member of this workspace.",
        });
      }

      throw error;
    }
  }

  listPendingInvitations(access: WorkspaceAccess): Promise<WorkspaceInvitationRecord[]> {
    return this.workspacesRepository.listPendingInvitations(access.workspaceId);
  }

  async revokeInvitation(access: WorkspaceAccess, actor: AuthenticatedUser, invitationId: string) {
    const invitation = await this.workspacesRepository.listPendingInvitations(access.workspaceId);
    if (!invitation.some((item) => item.id === invitationId)) {
      throw new NotFoundException({
        code: "INVITATION_NOT_FOUND",
        message: "Pending invitation not found.",
      });
    }

    const revoked = await this.prisma.withTransaction(async (transaction) => {
      const result = await this.workspacesRepository.revokeInvitation(invitationId, transaction);
      await transaction.auditEvent.create({
        data: {
          action: "WORKSPACE_INVITATION_REVOKED",
          actorUserId: actor.id,
          entity: "WorkspaceInvitation",
          entityId: invitationId,
          metadata: {},
          workspaceId: access.workspaceId,
        },
      });
      return result;
    });

    return revoked;
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

function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
