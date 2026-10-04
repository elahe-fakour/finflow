import { AuthenticationModule } from "@nestjs/authentication";
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [
    AuthenticationModule.forRoot({
      globalGuard: false,
    }),
    HealthModule,
    CustomersModule,
    AuthModule,
  ],
})
export class AppModule {}
