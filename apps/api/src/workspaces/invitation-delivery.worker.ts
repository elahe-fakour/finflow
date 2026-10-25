import { Injectable, Inject } from "@nestjs/common";
import { decryptInvitationToken } from "../security/invitation-encryption.js";
import type { InvitationDelivery } from "./invitation-delivery.js";
import { WorkspacesRepository } from "./workspaces.repository.js";
import { InvitationDeliveryMetrics } from "./invitation-delivery.metrics.js";

@Injectable()
export class InvitationDeliveryWorker {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    @Inject("InvitationDelivery") private readonly invitationDelivery: InvitationDelivery,
    private readonly metrics: InvitationDeliveryMetrics,
  ) {}

  async processPending(limit = 25): Promise<{ failed: number; sent: number }> {
    const startedAt = Date.now();
    const recovered = await this.workspacesRepository.recoverStaleInvitationDeliveries(
      new Date(Date.now() - 5 * 60_000),
    );
    this.metrics.recordRecovered(recovered.count);
    const deliveries = await this.workspacesRepository.listPendingInvitationDeliveries(limit);
    let sent = 0;
    let failed = 0;

    for (const delivery of deliveries) {
      if (!(await this.workspacesRepository.claimInvitationDelivery(delivery.id))) {
        this.metrics.recordRetry();
        continue;
      }
      try {
        await this.invitationDelivery.sendInvitation({
          email: delivery.email,
          expiresAt: delivery.expiresAt,
          role: delivery.role,
          token: decryptInvitationToken(delivery.encryptedToken),
          workspaceId: delivery.workspaceId,
        });
        await this.workspacesRepository.markInvitationDeliverySent(delivery.id);
        this.metrics.recordSent();
        sent += 1;
      } catch (error) {
        await this.workspacesRepository.markInvitationDeliveryFailed(
          delivery.id,
          error instanceof Error ? error.message : "Unknown delivery error",
        );
        this.metrics.recordFailed();
        failed += 1;
      }
    }

    this.metrics.recordCycle(Date.now() - startedAt);
    return { failed, sent };
  }
}
