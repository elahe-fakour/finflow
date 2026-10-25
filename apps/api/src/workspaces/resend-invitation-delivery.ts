import type { InvitationDelivery, InvitationDeliveryMessage } from "./invitation-delivery.js";

export class ResendInvitationDelivery implements InvitationDelivery {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly webOrigin: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async sendInvitation(message: InvitationDeliveryMessage): Promise<void> {
    const response = await this.fetchImplementation("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: this.from,
        html: `<p>You have been invited to join a FinFlow workspace.</p><p><a href="${this.webOrigin}/invitations/${message.token}">Accept invitation</a></p>`,
        subject: "You have been invited to FinFlow",
        to: [message.email],
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Email provider returned HTTP ${response.status}.`);
    }
  }
}
