import { Injectable } from "@nestjs/common";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import type { ListAuditEventsDto } from "./dto/list-audit-events.dto.js";
import { AuditEventsRepository } from "./audit-events.repository.js";

export type AuditEventResponse = {
  action: string;
  actor: { displayName: string | null; email: string };
  createdAt: string;
  entity: string;
  entityId: string;
  id: string;
  metadata: unknown;
};

export type PaginatedAuditEvents = {
  data: AuditEventResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

@Injectable()
export class AuditEventsService {
  constructor(private readonly repository: AuditEventsRepository) {}

  async list(scope: WorkspaceScope, input: ListAuditEventsDto): Promise<PaginatedAuditEvents> {
    const result = await this.repository.list(scope, input.page, input.pageSize);

    return {
      data: result.events.map((event) => ({
        action: event.action,
        actor: event.actor,
        createdAt: event.createdAt.toISOString(),
        entity: event.entity,
        entityId: event.entityId,
        id: event.id,
        metadata: event.metadata,
      })),
      page: input.page,
      pageSize: input.pageSize,
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / input.pageSize),
    };
  }
}
