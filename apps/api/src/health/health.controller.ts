import { Public } from "@nestjs/authentication";
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { HealthService } from "./health.service.js";

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  @Public()
  getLiveness() {
    return { status: "ok" as const };
  }

  @Get("ready")
  @Public()
  async getReadiness() {
    const result = await this.healthService.check();
    if (result.status !== "ok") {
      throw new ServiceUnavailableException({
        error: "Service Unavailable",
        code: "SERVICE_NOT_READY",
        message: "The service dependencies are unavailable.",
      });
    }
    return result;
  }
}
