import { Injectable } from "@nestjs/common";
import type { Customer } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(scope: WorkspaceScope): Promise<Customer[]> {
    return this.prisma.database.customer.findMany({
      where: {
        workspaceId: scope.workspaceId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  findById(scope: WorkspaceScope, customerId: string): Promise<Customer | null> {
    return this.prisma.database.customer.findUnique({
      where: {
        workspaceId_id: {
          workspaceId: scope.workspaceId,
          id: customerId,
        },
      },
    });
  }
}
