import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { IncomeExpenseEntriesController } from "./income-expense-entries.controller.js";
import { IncomeExpenseEntriesRepository } from "./income-expense-entries.repository.js";
import { IncomeExpenseEntriesService } from "./income-expense-entries.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [IncomeExpenseEntriesController],
  providers: [IncomeExpenseEntriesRepository, IncomeExpenseEntriesService],
})
export class IncomeExpenseEntriesModule {}
