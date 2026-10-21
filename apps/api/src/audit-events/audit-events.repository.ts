import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { ListAuditEventsDto } from "./dto/list-audit-events.dto.js";

@Injectable()
export class AuditEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(scope: WorkspaceScope, input: ListAuditEventsDto) {
    const where = {
      workspaceId: scope.workspaceId,
      ...(input.action === undefined ? {} : { action: input.action }),
      ...(input.actor === undefined
        ? {}
        : {
            actor: {
              OR: [
                { email: { contains: input.actor, mode: "insensitive" as const } },
                { displayName: { contains: input.actor, mode: "insensitive" as const } },
              ],
            },
          }),
      ...(input.from === undefined && input.to === undefined
        ? {}
        : {
            createdAt: {
              ...(input.from === undefined ? {} : { gte: toStartOfDay(input.from) }),
              ...(input.to === undefined ? {} : { lte: toEndOfDay(input.to) }),
            },
          }),
    };
    const [events, totalItems] = await Promise.all([
      this.prisma.database.auditEvent.findMany({
        where,
        include: { actor: { select: { email: true, displayName: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.database.auditEvent.count({ where }),
    ]);

    return { events, totalItems };
  }
}

function toStartOfDay(value: string) {
  return value.length === 10 ? new Date(`${value}T00:00:00.000Z`) : new Date(value);
}

function toEndOfDay(value: string) {
  return value.length === 10 ? new Date(`${value}T23:59:59.999Z`) : new Date(value);
}
