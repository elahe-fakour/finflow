import { Injectable } from "@nestjs/common";

type InvitationDeliveryMetricsSnapshot = Readonly<{
  failed: number;
  recovered: number;
  retried: number;
  sent: number;
  lastCycleAt: string | null;
  lastCycleDurationMs: number | null;
}>;

@Injectable()
export class InvitationDeliveryMetrics {
  private failed = 0;
  private recovered = 0;
  private retried = 0;
  private sent = 0;
  private lastCycleAt: Date | null = null;
  private lastCycleDurationMs: number | null = null;

  recordCycle(durationMs: number): void {
    this.lastCycleAt = new Date();
    this.lastCycleDurationMs = durationMs;
  }
  recordSent(): void {
    this.sent += 1;
  }
  recordFailed(): void {
    this.failed += 1;
  }
  recordRetry(): void {
    this.retried += 1;
  }
  recordRecovered(count: number): void {
    this.recovered += count;
  }

  snapshot(): InvitationDeliveryMetricsSnapshot {
    return {
      failed: this.failed,
      recovered: this.recovered,
      retried: this.retried,
      sent: this.sent,
      lastCycleAt: this.lastCycleAt?.toISOString() ?? null,
      lastCycleDurationMs: this.lastCycleDurationMs,
    };
  }
}

export type { InvitationDeliveryMetricsSnapshot };
