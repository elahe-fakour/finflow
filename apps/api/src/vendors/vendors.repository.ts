import { Injectable } from "@nestjs/common";
import type { PrismaClient } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

type VendorQueryClient = Pick<PrismaClient, "vendor">;

export type VendorOption = {
  id: string;
  name: string;
};

@Injectable()
export class VendorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(
    scope: WorkspaceScope,
    database: VendorQueryClient = this.prisma.database,
  ): Promise<VendorOption[]> {
    return database.vendor.findMany({
      where: { workspaceId: scope.workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
