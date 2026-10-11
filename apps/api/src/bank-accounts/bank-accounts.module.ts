import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { WorkspacesModule } from "../workspaces/workspaces.module.js";
import { BankAccountsController } from "./bank-accounts.controller.js";
import { BankAccountsRepository } from "./bank-accounts.repository.js";
import { BankAccountsService } from "./bank-accounts.service.js";

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [BankAccountsController],
  providers: [BankAccountsRepository, BankAccountsService],
})
export class BankAccountsModule {}
