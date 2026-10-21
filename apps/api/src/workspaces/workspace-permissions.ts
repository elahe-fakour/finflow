import { WorkspaceRole } from "../generated/prisma/client.js";

export const WorkspacePermission = {
  VIEW: "workspace:view",
  MANAGE_SETTINGS: "workspace:manage-settings",
  MANAGE_FINANCIAL_DATA: "workspace:manage-financial-data",
  MANAGE_MEMBERS: "workspace:manage-members",
  MANAGE_OWNERSHIP: "workspace:manage-ownership",
  VIEW_AUDIT_LOG: "workspace:view-audit-log",
} as const;

export type WorkspacePermission = (typeof WorkspacePermission)[keyof typeof WorkspacePermission];

const ALL_PERMISSIONS = Object.values(WorkspacePermission);

const permissionsByRole: Readonly<Record<WorkspaceRole, readonly WorkspacePermission[]>> = {
  [WorkspaceRole.OWNER]: ALL_PERMISSIONS,
  [WorkspaceRole.ADMIN]: [
    WorkspacePermission.VIEW,
    WorkspacePermission.MANAGE_SETTINGS,
    WorkspacePermission.MANAGE_FINANCIAL_DATA,
    WorkspacePermission.MANAGE_MEMBERS,
  ],
  [WorkspaceRole.ACCOUNTANT]: [
    WorkspacePermission.VIEW,
    WorkspacePermission.VIEW_AUDIT_LOG,
    WorkspacePermission.MANAGE_FINANCIAL_DATA,
  ],
  [WorkspaceRole.MEMBER]: [WorkspacePermission.VIEW],
};

function hasWorkspacePermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  return permissionsByRole[role].includes(permission);
}

export { hasWorkspacePermission, permissionsByRole };
