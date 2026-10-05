import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WORKSPACE_PERMISSION_KEY } from "./require-workspace-permission.decorator.js";
import { hasWorkspacePermission, type WorkspacePermission } from "./workspace-permissions.js";
import type { WorkspaceRequest } from "./workspace-access.js";

/**
 * Enforces the explicit permission declared by a workspace-scoped route.
 *
 * This guard expects WorkspaceMembershipGuard to run first and attach the
 * current membership role to the request.
 */
@Injectable()
export class WorkspacePermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<WorkspacePermission>(
      WORKSPACE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();
    const access = request.workspaceAccess;

    if (
      permission === undefined ||
      access === undefined ||
      !hasWorkspacePermission(access.role, permission)
    ) {
      throw new ForbiddenException({
        code: "WORKSPACE_PERMISSION_DENIED",
        message: "You do not have permission to perform this action in this workspace.",
      });
    }

    return true;
  }
}
