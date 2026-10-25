import { describe, expect, it, vi } from "vitest";
import { ResendInvitationDelivery } from "../src/workspaces/resend-invitation-delivery.js";

describe("ResendInvitationDelivery", () => {
  it("posts an invitation email without logging the API key", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const delivery = new ResendInvitationDelivery(
      "re_test_secret",
      "FinFlow <noreply@example.com>",
      "http://localhost:3000",
      fetchImplementation,
    );

    await delivery.sendInvitation({
      email: "member@acme.example",
      expiresAt: new Date("2026-11-01T00:00:00.000Z"),
      role: "MEMBER",
      token: "invite-token",
      workspaceId: "workspace-1",
    });

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer re_test_secret" }),
      }),
    );
    expect(JSON.parse(fetchImplementation.mock.calls[0][1].body)).toMatchObject({
      to: ["member@acme.example"],
    });
  });

  it("turns provider failures into retryable errors", async () => {
    const delivery = new ResendInvitationDelivery(
      "re_test_secret",
      "FinFlow <noreply@example.com>",
      "http://localhost:3000",
      vi.fn().mockResolvedValue(new Response(null, { status: 429 })),
    );

    await expect(
      delivery.sendInvitation({
        email: "member@acme.example",
        expiresAt: new Date(),
        role: "MEMBER",
        token: "invite-token",
        workspaceId: "workspace-1",
      }),
    ).rejects.toThrow("HTTP 429");
  });
});
