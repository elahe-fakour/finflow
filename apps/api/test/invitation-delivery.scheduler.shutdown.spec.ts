import { describe, expect, it, vi } from "vitest";
import { InvitationDeliveryScheduler } from "../src/workspaces/invitation-delivery.scheduler.js";
import type { InvitationDeliveryWorker } from "../src/workspaces/invitation-delivery.worker.js";

describe("InvitationDeliveryScheduler shutdown", () => {
  it("clears the timer during module destroy", async () => {
    vi.useFakeTimers();
    const scheduler = new InvitationDeliveryScheduler({} as InvitationDeliveryWorker);
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    scheduler.onModuleInit();

    await scheduler.onModuleDestroy();
    expect(clearIntervalSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
