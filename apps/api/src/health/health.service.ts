import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { InvitationDeliveryMetrics } from "../workspaces/invitation-delivery.metrics.js";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryMetrics: InvitationDeliveryMetrics,
  ) {}

  async check() {
    const database = await this.checkDatabase();
    return {
      status: database.status === "ok" ? ("ok" as const) : ("degraded" as const),
      checks: {
        api: { status: "ok" as const },
        database,
        invitationDelivery: { status: "ok" as const, metrics: this.deliveryMetrics.snapshot() },
      },
    };
  }

  private async checkDatabase() {
    const startedAt = Date.now();
    try {
      await this.prisma.database.$queryRaw`SELECT 1`;
      return { status: "ok" as const, responseTimeMs: Date.now() - startedAt };
    } catch {
      return { status: "error" as const, responseTimeMs: Date.now() - startedAt };
    }
  }
}
