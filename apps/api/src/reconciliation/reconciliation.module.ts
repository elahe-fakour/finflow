import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { ReconciliationController } from "./reconciliation.controller.js";
import { ReconciliationRepository } from "./reconciliation.repository.js";
import { ReconciliationService } from "./reconciliation.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationRepository, ReconciliationService],
})
export class ReconciliationModule {}
