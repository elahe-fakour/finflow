import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { AuditEventsController } from "./audit-events.controller.js";
import { AuditEventsRepository } from "./audit-events.repository.js";
import { AuditEventsService } from "./audit-events.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [AuditEventsController],
  providers: [AuditEventsRepository, AuditEventsService],
})
export class AuditEventsModule {}
