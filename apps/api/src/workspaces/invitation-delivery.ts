export type InvitationDeliveryMessage = {
  email: string;
  expiresAt: Date;
  role: string;
  token: string;
  workspaceId: string;
};

/**
 * Boundary for sending invitation messages. Implementations must never persist
 * the raw token; it is only available during the request that creates it.
 */
export interface InvitationDelivery {
  sendInvitation(message: InvitationDeliveryMessage): Promise<void>;
}

export class DevelopmentInvitationDelivery implements InvitationDelivery {
  async sendInvitation(_message: InvitationDeliveryMessage): Promise<void> {
    // Email delivery is intentionally deferred until a provider and secret
    // management strategy are selected. The API response remains testable locally.
  }
}
