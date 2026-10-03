import { Injectable } from "@nestjs/common";
import type { Customer, PrismaClient } from "../generated/prisma/client.js";
import type { TransactionClient } from "../database/financial-transaction.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type CustomerQueryClient = Pick<PrismaClient, "customer">;

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    scope: WorkspaceScope,
    database: CustomerQueryClient | TransactionClient = this.prisma.database,
  ): Promise<Customer[]> {
    return database.customer.findMany({
      where: {
        workspaceId: scope.workspaceId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  findById(
    scope: WorkspaceScope,
    customerId: string,
    database: CustomerQueryClient | TransactionClient = this.prisma.database,
  ): Promise<Customer | null> {
    return database.customer.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: customerId,
        },
      },
    });
  }
}
