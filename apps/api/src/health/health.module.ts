import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { HealthService } from "./health.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
