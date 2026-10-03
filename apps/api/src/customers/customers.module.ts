import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { CustomersRepository } from "./customers.repository.js";
import { CustomersService } from "./customers.service.js";

@Module({
  imports: [DatabaseModule],
  providers: [CustomersRepository, CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
