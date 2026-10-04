import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { WorkspaceRole } from "../generated/prisma/client.js";
import type { WorkspaceScope } from "./workspace-scope.js";

export type WorkspaceAccess = WorkspaceScope &
  Readonly<{
    role: WorkspaceRole;
  }>;

export type WorkspaceRequest = {
  params: Record<string, string | undefined>;
  user?: unknown;
  workspaceAccess?: WorkspaceAccess;
};

export const CurrentWorkspace = createParamDecorator(
  (_: unknown, context: ExecutionContext): WorkspaceAccess | undefined => {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();

    return request.workspaceAccess;
  },
);
