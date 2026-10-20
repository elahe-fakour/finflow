import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";

@Injectable()
export class AuditEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(scope: WorkspaceScope, page: number, pageSize: number) {
    const where = { workspaceId: scope.workspaceId };
    const [events, totalItems] = await Promise.all([
      this.prisma.database.auditEvent.findMany({
        where,
        include: { actor: { select: { email: true, displayName: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.database.auditEvent.count({ where }),
    ]);

    return { events, totalItems };
  }
}
