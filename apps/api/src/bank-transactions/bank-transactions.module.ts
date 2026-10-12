import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { BankTransactionsController } from "./bank-transactions.controller.js";
import { BankTransactionsRepository } from "./bank-transactions.repository.js";
import { BankTransactionsService } from "./bank-transactions.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [BankTransactionsController],
  providers: [BankTransactionsRepository, BankTransactionsService],
})
export class BankTransactionsModule {}
