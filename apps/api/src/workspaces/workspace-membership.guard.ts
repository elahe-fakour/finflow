import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { isUUID } from "class-validator";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import { WorkspacesRepository } from "./workspaces.repository.js";
import type { WorkspaceRequest } from "./workspace-access.js";

const WORKSPACE_ID_PARAMETER = "workspaceId";

/**
 * Confirms that the authenticated user belongs to the workspace addressed by
 * the route, then attaches the server-authorized scope for the controller.
 */
@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
  constructor(private readonly workspacesRepository: WorkspacesRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();
    const workspaceId = request.params[WORKSPACE_ID_PARAMETER];
    const user = request.user;

    if (!isAuthenticatedUser(user)) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      });
    }

    if (workspaceId === undefined || !isUUID(workspaceId)) {
      throw workspaceNotFound();
    }

    const membership = await this.workspacesRepository.findMembership(workspaceId, user.id);

    if (membership === null) {
      throw workspaceNotFound();
    }

    request.workspaceAccess = {
      workspaceId,
      role: membership.role,
    };

    return true;
  }
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "displayName" in value &&
    (typeof value.displayName === "string" || value.displayName === null)
  );
}

function workspaceNotFound(): NotFoundException {
  return new NotFoundException({
    code: "WORKSPACE_NOT_FOUND",
    message: "Workspace not found.",
  });
}
