import "./environment.js";
import { AuthenticationModule } from "@nestjs/authentication";
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";
import { IncomeExpenseCategoriesModule } from "./income-expense-categories/income-expense-categories.module.js";
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
    IncomeExpenseCategoriesModule,
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
