import { Module } from "@nestjs/common";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [HealthModule, CustomersModule],
})
export class AppModule {}
