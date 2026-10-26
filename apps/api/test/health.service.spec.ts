import { describe, expect, it, vi } from "vitest";
import { HealthService } from "../src/health/health.service.js";
import { InvitationDeliveryMetrics } from "../src/workspaces/invitation-delivery.metrics.js";

describe("HealthService", () => {
  it("reports healthy dependencies", async () => {
    const service = new HealthService(
      { database: { $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]) } } as never,
      new InvitationDeliveryMetrics(),
    );
    await expect(service.check()).resolves.toMatchObject({
      status: "ok",
      checks: { api: { status: "ok" }, database: { status: "ok" } },
    });
  });

  it("reports degraded status when database is unavailable", async () => {
    const service = new HealthService(
      { database: { $queryRaw: vi.fn().mockRejectedValue(new Error("offline")) } } as never,
      new InvitationDeliveryMetrics(),
    );
    await expect(service.check()).resolves.toMatchObject({
      status: "degraded",
      checks: { database: { status: "error" } },
    });
  });
});
