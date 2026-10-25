import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesController } from "./workspaces.controller.js";
import { WorkspaceMembershipGuard } from "./workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "./workspace-permission.guard.js";
import { WorkspacesRepository } from "./workspaces.repository.js";
import { WorkspacesService } from "./workspaces.service.js";
import { DevelopmentInvitationDelivery } from "./invitation-delivery.js";
import { InvitationDeliveryWorker } from "./invitation-delivery.worker.js";

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesRepository,
    WorkspacesService,
    WorkspaceMembershipGuard,
    WorkspacePermissionGuard,
    { provide: "InvitationDelivery", useClass: DevelopmentInvitationDelivery },
    InvitationDeliveryWorker,
  ],
  exports: [
    WorkspacesRepository,
    WorkspaceMembershipGuard,
    WorkspacePermissionGuard,
    InvitationDeliveryWorker,
  ],
})
export class WorkspacesModule {}
