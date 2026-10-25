import { describe, expect, it, vi } from "vitest";
import { encryptInvitationToken } from "../src/security/invitation-encryption.js";
import { InvitationDeliveryWorker } from "../src/workspaces/invitation-delivery.worker.js";
import type { InvitationDelivery } from "../src/workspaces/invitation-delivery.js";
import type { WorkspacesRepository } from "../src/workspaces/workspaces.repository.js";
import { InvitationDeliveryMetrics } from "../src/workspaces/invitation-delivery.metrics.js";

const key = Buffer.alloc(32, 7);

describe("InvitationDeliveryWorker", () => {
  it("sends a pending delivery and marks it as sent", async () => {
    const sendInvitation = vi.fn();
    const repository = {
      listPendingInvitationDeliveries: vi.fn().mockResolvedValue([
        {
          attempts: 0,
          email: "member@acme.example",
          encryptedToken: encryptInvitationToken("invite-token", key),
          expiresAt: new Date("2026-11-01T00:00:00.000Z"),
          id: "delivery-1",
          role: "MEMBER",
          workspaceId: "workspace-1",
        },
      ]),
      recoverStaleInvitationDeliveries: vi.fn().mockResolvedValue({ count: 0 }),
      claimInvitationDelivery: vi.fn().mockResolvedValue(true),
      markInvitationDeliverySent: vi.fn(),
      markInvitationDeliveryFailed: vi.fn(),
    };
    const worker = new InvitationDeliveryWorker(
      repository as unknown as WorkspacesRepository,
      { sendInvitation } as InvitationDelivery,
      new InvitationDeliveryMetrics(),
    );

    process.env.INVITATION_ENCRYPTION_KEY = "07".repeat(32);
    await expect(worker.processPending()).resolves.toEqual({ failed: 0, sent: 1 });
    expect(sendInvitation).toHaveBeenCalledWith(expect.objectContaining({ token: "invite-token" }));
    expect(repository.markInvitationDeliverySent).toHaveBeenCalledWith("delivery-1");
  });

  it("records a failure without exposing the token", async () => {
    const repository = {
      listPendingInvitationDeliveries: vi.fn().mockResolvedValue([
        {
          attempts: 0,
          email: "member@acme.example",
          encryptedToken: encryptInvitationToken("invite-token", key),
          expiresAt: new Date("2026-11-01T00:00:00.000Z"),
          id: "delivery-1",
          role: "MEMBER",
          workspaceId: "workspace-1",
        },
      ]),
      recoverStaleInvitationDeliveries: vi.fn().mockResolvedValue({ count: 0 }),
      claimInvitationDelivery: vi.fn().mockResolvedValue(true),
      markInvitationDeliverySent: vi.fn(),
      markInvitationDeliveryFailed: vi.fn(),
    };
    const worker = new InvitationDeliveryWorker(
      repository as unknown as WorkspacesRepository,
      {
        sendInvitation: vi.fn().mockRejectedValue(new Error("SMTP unavailable")),
      },
      new InvitationDeliveryMetrics(),
    );

    process.env.INVITATION_ENCRYPTION_KEY = "07".repeat(32);
    await expect(worker.processPending()).resolves.toEqual({ failed: 1, sent: 0 });
    expect(repository.markInvitationDeliveryFailed).toHaveBeenCalledWith(
      "delivery-1",
      "SMTP unavailable",
    );
  });
});
