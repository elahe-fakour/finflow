import { describe, expect, it, vi } from "vitest";
import { InvitationDeliveryScheduler } from "../src/workspaces/invitation-delivery.scheduler.js";
import type { InvitationDeliveryWorker } from "../src/workspaces/invitation-delivery.worker.js";

describe("InvitationDeliveryScheduler", () => {
  it("does not overlap worker runs", async () => {
    let resolveRun: (() => void) | undefined;
    const processPending = vi.fn(
      () =>
        new Promise<{ failed: number; sent: number }>(
          (resolve) => (resolveRun = () => resolve({ failed: 0, sent: 1 })),
        ),
    );
    const scheduler = new InvitationDeliveryScheduler({
      processPending,
    } as unknown as InvitationDeliveryWorker);

    const first = scheduler.runOnce();
    const second = scheduler.runOnce();
    expect(processPending).toHaveBeenCalledTimes(1);
    resolveRun?.();
    await first;
    await second;
  });
});
