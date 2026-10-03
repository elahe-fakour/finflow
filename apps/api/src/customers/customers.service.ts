import { Injectable, NotFoundException } from "@nestjs/common";
import type { Customer } from "../generated/prisma/client.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import { CustomersRepository } from "./customers.repository.js";

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  list(scope: WorkspaceScope): Promise<Customer[]> {
    return this.customersRepository.list(scope);
  }

  async getById(scope: WorkspaceScope, customerId: string): Promise<Customer> {
    const customer = await this.customersRepository.findById(scope, customerId);

    if (customer === null) {
      throw new NotFoundException({
        code: "CUSTOMER_NOT_FOUND",
        message: "Customer not found.",
      });
    }

    return customer;
  }
}
