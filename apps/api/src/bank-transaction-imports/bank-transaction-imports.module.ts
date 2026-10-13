import { Module } from "@nestjs/common";
import { BankTransactionsModule } from "../bank-transactions/bank-transactions.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { BankTransactionImportsController } from "./bank-transaction-imports.controller.js";
import { BankTransactionImportsService } from "./bank-transaction-imports.service.js";

@Module({
  imports: [BankTransactionsModule, WorkspacesModule],
  controllers: [BankTransactionImportsController],
  providers: [BankTransactionImportsService],
})
export class BankTransactionImportsModule {}
