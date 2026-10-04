import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { PrismaSessionAuthenticationProvider } from "./prisma-session-authentication.provider.js";
import { PrismaSessionStore } from "./prisma-session.store.js";
import { AuthService } from "./auth.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, PrismaSessionStore, PrismaSessionAuthenticationProvider],
})
export class AuthModule {}
