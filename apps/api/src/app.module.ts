import { AuthenticationModule } from "@nestjs/authentication";
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [
    AuthenticationModule.forRoot({
      globalGuard: false,
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
