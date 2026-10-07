import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { IncomeExpenseCategoriesController } from "./income-expense-categories.controller.js";
import { IncomeExpenseCategoriesRepository } from "./income-expense-categories.repository.js";
import { IncomeExpenseCategoriesService } from "./income-expense-categories.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [IncomeExpenseCategoriesController],
  providers: [IncomeExpenseCategoriesRepository, IncomeExpenseCategoriesService],
})
export class IncomeExpenseCategoriesModule {}
