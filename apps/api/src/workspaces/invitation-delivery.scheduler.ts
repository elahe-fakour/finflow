import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { InvitationDeliveryWorker } from "./invitation-delivery.worker.js";

const DEFAULT_INTERVAL_MS = 0;

@Injectable()
export class InvitationDeliveryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InvitationDeliveryScheduler.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(private readonly worker: InvitationDeliveryWorker) {}

  onModuleInit(): void {
    const interval = readInterval();
    if (interval === 0) return;

    this.timer = setInterval(() => {
      void this.runOnce();
    }, interval);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.worker.processPending();
      if (result.sent > 0 || result.failed > 0) {
        this.logger.log(
          `Invitation delivery cycle completed: ${result.sent} sent, ${result.failed} failed.`,
        );
      }
    } catch (error) {
      this.logger.error(
        "Invitation delivery cycle failed.",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}

function readInterval(): number {
  const value = Number(process.env.INVITATION_DELIVERY_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("INVITATION_DELIVERY_INTERVAL_MS must be a non-negative integer.");
  }
  return value;
}
