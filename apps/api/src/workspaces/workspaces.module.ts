import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesController } from "./workspaces.controller.js";
import { WorkspaceMembershipGuard } from "./workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "./workspace-permission.guard.js";
import { WorkspacesRepository } from "./workspaces.repository.js";
import { WorkspacesService } from "./workspaces.service.js";
import { DevelopmentInvitationDelivery } from "./invitation-delivery.js";
import { InvitationDeliveryWorker } from "./invitation-delivery.worker.js";
import { ResendInvitationDelivery } from "./resend-invitation-delivery.js";
import { InvitationDeliveryScheduler } from "./invitation-delivery.scheduler.js";
import { InvitationDeliveryMetrics } from "./invitation-delivery.metrics.js";

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesRepository,
    WorkspacesService,
    WorkspaceMembershipGuard,
    WorkspacePermissionGuard,
    {
      provide: "InvitationDelivery",
      useFactory: () => {
        const apiKey = process.env.RESEND_API_KEY?.trim();
        const from = process.env.EMAIL_FROM?.trim();
        const webOrigin = process.env.WEB_ORIGIN?.trim();

        if (apiKey && from && webOrigin) {
          return new ResendInvitationDelivery(apiKey, from, webOrigin);
        }

        return new DevelopmentInvitationDelivery();
      },
    },
    InvitationDeliveryWorker,
    InvitationDeliveryScheduler,
    InvitationDeliveryMetrics,
  ],
  exports: [
    WorkspacesRepository,
    WorkspaceMembershipGuard,
    WorkspacePermissionGuard,
    InvitationDeliveryWorker,
    InvitationDeliveryMetrics,
  ],
})
export class WorkspacesModule {}
