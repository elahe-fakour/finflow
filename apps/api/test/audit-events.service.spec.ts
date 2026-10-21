import { describe, expect, it, vi } from "vitest";
import type { AuditEventsRepository } from "../src/audit-events/audit-events.repository.js";
import { AuditEventsService } from "../src/audit-events/audit-events.service.js";

describe("audit events service", () => {
  it("returns workspace-scoped events with pagination metadata", async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({
        events: [
          {
            action: "RECONCILIATION_CONFIRMED",
            actor: { displayName: "Elahé", email: "elahe@example.com" },
            createdAt: new Date("2026-10-20T10:00:00.000Z"),
            entity: "Reconciliation",
            entityId: "reconciliation-1",
            id: "audit-1",
            metadata: { confidenceBasisPoints: 9600 },
          },
        ],
        totalItems: 3,
      }),
    };
    const service = new AuditEventsService(repository as unknown as AuditEventsRepository);

    await expect(
      service.list({ workspaceId: "workspace-1" }, { page: 2, pageSize: 2 }),
    ).resolves.toMatchObject({
      page: 2,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
      data: [{ action: "RECONCILIATION_CONFIRMED", entity: "Reconciliation" }],
    });
    expect(repository.list).toHaveBeenCalledWith(
      { workspaceId: "workspace-1" },
      { page: 2, pageSize: 2 },
    );
  });
});
