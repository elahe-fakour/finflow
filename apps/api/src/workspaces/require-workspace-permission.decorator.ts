import { SetMetadata } from "@nestjs/common";
import type { WorkspacePermission } from "./workspace-permissions.js";

const WORKSPACE_PERMISSION_KEY = "finflow:workspace-permission";

const RequireWorkspacePermission = (permission: WorkspacePermission) =>
  SetMetadata(WORKSPACE_PERMISSION_KEY, permission);

export { RequireWorkspacePermission, WORKSPACE_PERMISSION_KEY };
