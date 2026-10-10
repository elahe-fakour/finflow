import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { VendorsController } from "./vendors.controller.js";
import { VendorsRepository } from "./vendors.repository.js";
import { VendorsService } from "./vendors.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [VendorsController],
  providers: [VendorsRepository, VendorsService],
})
export class VendorsModule {}
