import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { InvitationDeliveryMetrics } from "../src/workspaces/invitation-delivery.metrics.js";
import { InvitationDeliveryWorker } from "../src/workspaces/invitation-delivery.worker.js";
import { WorkspacesController } from "../src/workspaces/workspaces.controller.js";
import type { WorkspacesService } from "../src/workspaces/workspaces.service.js";

describe("WorkspacesController delivery metrics", () => {
  it("returns non-sensitive metrics outside production", () => {
    const metrics = new InvitationDeliveryMetrics();
    metrics.recordSent();
    const controller = new WorkspacesController(
      {} as WorkspacesService,
      {} as InvitationDeliveryWorker,
      metrics,
    );
    delete process.env.NODE_ENV;

    expect(controller.metrics()).toMatchObject({ sent: 1, failed: 0 });
  });

  it("rejects metrics in production", () => {
    const controller = new WorkspacesController(
      {} as WorkspacesService,
      {} as InvitationDeliveryWorker,
      new InvitationDeliveryMetrics(),
    );
    process.env.NODE_ENV = "production";

    expect(() => controller.metrics()).toThrow(ForbiddenException);
    delete process.env.NODE_ENV;
  });
});
