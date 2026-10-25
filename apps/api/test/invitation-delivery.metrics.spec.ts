import { describe, expect, it } from "vitest";
import { InvitationDeliveryMetrics } from "../src/workspaces/invitation-delivery.metrics.js";

describe("InvitationDeliveryMetrics", () => {
  it("returns non-sensitive delivery counters", () => {
    const metrics = new InvitationDeliveryMetrics();
    metrics.recordSent();
    metrics.recordFailed();
    metrics.recordRetry();
    metrics.recordRecovered(2);
    metrics.recordCycle(12);

    expect(metrics.snapshot()).toMatchObject({
      failed: 1,
      recovered: 2,
      retried: 1,
      sent: 1,
      lastCycleDurationMs: 12,
    });
  });
});
