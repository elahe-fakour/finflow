import "./environment.js";
import { AuthenticationModule } from "@nestjs/authentication";
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { BankAccountsModule } from "./bank-accounts/bank-accounts.module.js";
import { BankTransactionsModule } from "./bank-transactions/bank-transactions.module.js";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";
import { IncomeExpenseCategoriesModule } from "./income-expense-categories/income-expense-categories.module.js";
import { BankTransactionImportsModule } from "./bank-transaction-imports/bank-transaction-imports.module.js";
import { IncomeExpenseEntriesModule } from "./income-expense-entries/income-expense-entries.module.js";
import { VendorsModule } from "./vendors/vendors.module.js";
import { WorkspacesModule } from "./workspaces/workspaces.module.js";

@Module({
  imports: [
    AuthenticationModule.forRoot({
      globalGuard: true,
      session: {
        absoluteTtl: "7d",
        idleTtl: "1d",
        touchInterval: "1m",
        trustedOrigins: getTrustedWebOrigins(),
      },
    }),
    HealthModule,
    CustomersModule,
    AuthModule,
    WorkspacesModule,
    BankAccountsModule,
    BankTransactionsModule,
    IncomeExpenseCategoriesModule,
    BankTransactionImportsModule,
    IncomeExpenseEntriesModule,
    VendorsModule,
  ],
})
export class AppModule {}

function getTrustedWebOrigins(): string[] {
  if (process.env.WEB_ORIGIN !== undefined) {
    return [process.env.WEB_ORIGIN];
  }

  return process.env.NODE_ENV?.trim().toLowerCase() === "production"
    ? []
    : ["http://localhost:3000"];
}
