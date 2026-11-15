import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { ReportsController } from "./reports.controller.js";
import { ReportsRepository } from "./reports.repository.js";
import { ReportsService } from "./reports.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService],
})
export class ReportsModule {}
