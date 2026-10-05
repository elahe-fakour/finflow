import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesController } from "./workspaces.controller.js";
import { WorkspaceMembershipGuard } from "./workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "./workspace-permission.guard.js";
import { WorkspacesRepository } from "./workspaces.repository.js";
import { WorkspacesService } from "./workspaces.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesRepository,
    WorkspacesService,
    WorkspaceMembershipGuard,
    WorkspacePermissionGuard,
  ],
})
export class WorkspacesModule {}
